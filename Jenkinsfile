pipeline {
	agent any

	options {
		timestamps()
		ansiColor('xterm')
		disableConcurrentBuilds()
	}

	environment {
		DOCKERHUB_CREDENTIALS = '65c06f4e-b141-49d5-b7ce-0a113fcdbfd9'
		DOCKERHUB_NAMESPACE = 'Willstiti'
		SONARQUBE_ENV = 'sonarqube'
		IMAGE_TAG = "${env.BUILD_NUMBER}"
		BACKEND_IMAGE = "${DOCKERHUB_NAMESPACE}/tasklist-backend:${IMAGE_TAG}"
		FRONTEND_IMAGE = "${DOCKERHUB_NAMESPACE}/tasklist-frontend:${IMAGE_TAG}"
	}

	stages {
		stage('1. Install dependencies (npm ci)') {
			steps {
				dir('cicd-tasklist-backend') {
					sh 'npm ci'
				}
				dir('cicd-tasklist-frontend') {
					sh 'npm ci'
				}
			}
		}

		stage('2. Generate Prisma client') {
			steps {
				dir('cicd-tasklist-backend') {
					sh 'npm run prisma:generate'
				}
			}
		}

		stage('3. Run unit tests') {
			steps {
				dir('cicd-tasklist-backend') {
					sh 'npm run test'
				}
				dir('cicd-tasklist-frontend') {
					sh 'npm run test'
				}
			}
		}

		stage('4. Publish test reports') {
			steps {
				junit testResults: 'cicd-tasklist-backend/reports/junit.xml, cicd-tasklist-frontend/reports/junit.xml', allowEmptyResults: false
			}
		}

		stage('5. Run end-to-end tests') {
			steps {
				dir('cicd-tasklist-backend') {
					sh 'npm run test:e2e'
				}
			}
		}

		stage('6. SonarQube analysis') {
			steps {
				withSonarQubeEnv("${SONARQUBE_ENV}") {
					dir('cicd-tasklist-backend') {
						sh 'sonar-scanner -Dproject.settings=sonar-project.properties'
					}
					dir('cicd-tasklist-frontend') {
						sh 'sonar-scanner -Dproject.settings=sonar-project.properties'
					}
				}
			}
		}

		stage('7. SonarQube quality gate') {
			steps {
				timeout(time: 10, unit: 'MINUTES') {
					waitForQualityGate abortPipeline: true
				}
			}
		}

		stage('8. Build Docker images') {
			steps {
				script {
					docker.build("${BACKEND_IMAGE}", 'cicd-tasklist-backend')
					docker.build("${FRONTEND_IMAGE}", 'cicd-tasklist-frontend')
				}
			}
		}

		stage('9. Trivy image security scan') {
			steps {
				sh 'mkdir -p security-reports'
				sh "trivy image --severity CRITICAL,HIGH --format json --output security-reports/backend-trivy.json ${BACKEND_IMAGE}"
				sh "trivy image --severity CRITICAL,HIGH --format json --output security-reports/frontend-trivy.json ${FRONTEND_IMAGE}"
			}
		}

		stage('10. Generate security reports') {
			steps {
				sh "trivy image --severity CRITICAL,HIGH --format sarif --output security-reports/backend-trivy.sarif ${BACKEND_IMAGE}"
				sh "trivy image --severity CRITICAL,HIGH --format sarif --output security-reports/frontend-trivy.sarif ${FRONTEND_IMAGE}"
				archiveArtifacts artifacts: 'security-reports/*', fingerprint: true
			}
		}

		stage('11. Generate SBOM') {
			steps {
				sh 'mkdir -p sbom'
				sh "syft ${BACKEND_IMAGE} -o cyclonedx-json=sbom/backend-cyclonedx.json"
				sh "syft ${BACKEND_IMAGE} -o spdx-json=sbom/backend-spdx.json"
				sh "syft ${FRONTEND_IMAGE} -o cyclonedx-json=sbom/frontend-cyclonedx.json"
				sh "syft ${FRONTEND_IMAGE} -o spdx-json=sbom/frontend-spdx.json"
				archiveArtifacts artifacts: 'sbom/*', fingerprint: true
			}
		}

		stage('12. Push Docker images to Docker Hub') {
			steps {
				script {
					docker.withRegistry('https://index.docker.io/v1/', DOCKERHUB_CREDENTIALS) {
						docker.image("${BACKEND_IMAGE}").push()
						docker.image("${FRONTEND_IMAGE}").push()
						docker.image("${BACKEND_IMAGE}").push('latest')
						docker.image("${FRONTEND_IMAGE}").push('latest')
					}
				}
			}
		}
	}

	post {
		always {
			cleanWs(deleteDirs: true, disableDeferredWipeout: true)
		}
	}
}
