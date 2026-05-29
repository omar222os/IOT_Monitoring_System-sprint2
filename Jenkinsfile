pipeline {
    agent any

    environment {
        DOCKER_HUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_HUB_USERNAME = 'jaidazeidan'
        IMAGE_VERSION = "v1.${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Pulling pipeline config from GitHub...'
                checkout scm
                echo 'Cloning backend (fix/arch-fixes)...'
                withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GH_USER', passwordVariable: 'GH_TOKEN')]) {
                    sh 'rm -rf backend-repo && git clone -b fix/arch-fixes https://$GH_USER:$GH_TOKEN@github.com/nabil0412/IoT-Monitoring-System-backend.git backend-repo'
                    sh 'rm -rf frontend-repo && git clone https://$GH_USER:$GH_TOKEN@github.com/nabil0412/IoT-Monitoring-System-frontend.git frontend-repo'
                }
            }
        }

        stage('Build Images') {
            steps {
                echo 'Building Docker images...'
                sh "docker build -f backend-repo/backend.Dockerfile -t ${DOCKER_HUB_USERNAME}/iot-backend:${IMAGE_VERSION} ./backend-repo"
                sh "docker build -f backend-repo/database.Dockerfile -t ${DOCKER_HUB_USERNAME}/iot-database:${IMAGE_VERSION} ./backend-repo"
                sh "docker build -f frontend-repo/frontend.Dockerfile -t ${DOCKER_HUB_USERNAME}/iot-frontend:${IMAGE_VERSION} ./frontend-repo"
            }
        }

        stage('Login to Docker Hub') {
            steps {
                echo 'Logging into Docker Hub...'
                sh "echo ${DOCKER_HUB_CREDENTIALS_PSW} | docker login -u ${DOCKER_HUB_CREDENTIALS_USR} --password-stdin"
            }
        }

        stage('Push Images') {
            steps {
                echo 'Pushing images to Docker Hub...'
                sh "docker push ${DOCKER_HUB_USERNAME}/iot-backend:${IMAGE_VERSION}"
                sh "docker push ${DOCKER_HUB_USERNAME}/iot-database:${IMAGE_VERSION}"
                sh "docker push ${DOCKER_HUB_USERNAME}/iot-frontend:${IMAGE_VERSION}"
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                sh "IMAGE_VERSION=${IMAGE_VERSION} docker-compose -f docker-compose.hub.yml up -d"
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check the logs above.'
        }
    }
}
