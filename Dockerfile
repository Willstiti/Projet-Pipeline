FROM jenkins/jenkins:lts-jdk17
USER root

RUN apt-get update && apt-get install -y docker.io curl unzip && rm -rf /var/lib/apt/lists/*

# Installer sonar-scanner
RUN curl -sSL https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-6.2.1.4610-linux-x64.zip -o /tmp/sonar-scanner.zip \
    && unzip /tmp/sonar-scanner.zip -d /opt \
    && ln -s /opt/sonar-scanner-6.2.1.4610-linux-x64/bin/sonar-scanner /usr/local/bin/sonar-scanner \
    && rm /tmp/sonar-scanner.zip

USER jenkins