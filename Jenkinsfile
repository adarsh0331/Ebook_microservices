pipeline {
    agent any

    parameters {
        choice(
            name: 'SERVICE_NAME',
            choices: [
                'auth-service',
                'cart-service',
                'order-service',
                'payment-service'
            ],
            description: 'Select microservice to build & deploy'
        )
    }

    environment {
        DOCKERHUB_USER = 'adarshbarkunta'
        IMAGE_TAG = "${BUILD_NUMBER}"
        REGISTRY = "${DOCKERHUB_USER}/${SERVICE_NAME}"
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                dir("${SERVICE_NAME}") {
                    sh """
                    docker build -t $REGISTRY:$IMAGE_TAG .
                    docker tag $REGISTRY:$IMAGE_TAG $REGISTRY:latest
                    """
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-creds',
                    usernameVariable: 'USER',
                    passwordVariable: 'PASS'
                )]) {
                    sh """
                    echo $PASS | docker login -u $USER --password-stdin
                    docker push $REGISTRY:$IMAGE_TAG
                    docker push $REGISTRY:latest
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                dir("${SERVICE_NAME}") {
                    sh """
                    kubectl apply -f k8s/deploy.yaml
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ ${SERVICE_NAME} deployed successfully"
        }
        failure {
            echo "❌ Deployment failed for ${SERVICE_NAME}"
        }
    }
}
