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
                echo 'Pulling code from GitHub...'
                checkout scm
            }
        }

        stage('Build Images') {
            steps {
                echo 'Building Docker images...'
                sh "docker build -f backend/backend.Dockerfile -t ${DOCKER_HUB_USERNAME}/iot-backend:${IMAGE_VERSION} ./backend"
                sh "docker build -f frontend/frontend.Dockerfile -t ${DOCKER_HUB_USERNAME}/iot-frontend:${IMAGE_VERSION} ./frontend"
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
                sh "docker push ${DOCKER_HUB_USERNAME}/iot-frontend:${IMAGE_VERSION}"
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                sh "docker compose -f docker-compose.hub.yml up -d"
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