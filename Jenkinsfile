pipeline {
    agent any 

    environment {
        // Environment variables for easy configuration
        K6_SCRIPT = 'basic_load_test.js'
    }

    stages {
        stage('Checkout Code') {
            steps {
                // This pulls your repo so the scripts folder exists
                checkout scm
            }
        }
        
stage('Run Load Test') {
            steps {
                script {
                    // Running k6 inside Docker and mounting the current workspace to /src
                    sh """
                        docker run --rm -u 0:0 \
                        -v \$(pwd):/src \
                        grafana/k6:latest \
                        run /src/scripts/basic_load_test.js
                    """
                }
            }
            // This 'post' belongs to the 'Run Load Test' stage
            post {
                always {
                    echo "Test finished. Archiving HTML report..."
                    archiveArtifacts artifacts: 'summary.html', allowEmptyArchive: true
                }
            }
        }
    }

    // Global post actions for cleanup
    post {
        always {
            deleteDir() 
        }
    }
}