# Use the official LTS base image
FROM jenkins/jenkins:lts

# Switch to root user to perform installation
USER root

# Install Docker CLI client (dind)
RUN apt-get update && \
    apt-get install -y docker.io && \
    apt-get clean

# Switch back to the jenkins user
USER jenkins