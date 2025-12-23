pipeline {
    agent any

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Run Load Test') {
            steps {
                script {
                    sh """
                        # 1. Create a container but don't start it yet
                        CONTAINER_ID=\$(docker create -u 0:0 grafana/k6:latest run /src/scripts/basic_load_test.js)

                        # 2. Copy the entire current directory into the container's /src folder
                        docker cp . \${CONTAINER_ID}:/src

                        # 3. Start the container and wait for completion
                        docker start -a \${CONTAINER_ID}

                        # 4. Pull the summary report out from the root of the container
                        docker cp \${CONTAINER_ID}:/summary.html ./summary.html || echo "Summary not found"

                        # 5. Clean up the container
                        docker rm \${CONTAINER_ID}
                    """
                }
            }
            post {
                always {
                    echo "Archiving HTML report..."
                    archiveArtifacts artifacts: 'summary.html', allowEmptyArchive: true
                }
            }
        }
    }

    post {
        always {
            deleteDir()
        }
    }
}