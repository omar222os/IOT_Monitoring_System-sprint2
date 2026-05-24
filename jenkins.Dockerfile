FROM jenkins/jenkins:lts

USER root

# Install Docker inside Jenkins
RUN apt-get update && \
    apt-get install -y docker.io && \
    apt-get clean

# Give jenkins user permission to use Docker
RUN usermod -aG docker jenkins

USER jenkins