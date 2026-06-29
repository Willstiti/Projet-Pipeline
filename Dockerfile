
FROM jenkins/jenkins:lts-jdk17

USER root

# Installer Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Installer Docker CLI
RUN apt-get install -y docker.io

# Installer Trivy
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Installer sonar-scanner
RUN npm install -g sonarqube-scanner

USER jenkins