pipeline {
    agent any 

    environment {
        // Environment variables for easy configuration
        K6_SCRIPT = 'basic_load_test.js'
    }

    stages {
        stage('Checkout Code') {
            steps {
                withEnv(['HOME=/var/jenkins_home']) {
                    git url: 'https://github.com/johnmccooe/performance-tests-k6.git', branch: 'main'
                }
            }
        }
        
        stage('Run Load Test (Protocol Level)') {
            steps {
                echo "Running k6 test: ${env.K6_SCRIPT}"
                
                script {
                    sh """
                        docker run --rm -u 0:0 \
                        --entrypoint "/bin/sh" \
                        -v C:/k6_project:/src \
                        grafana/k6:latest -c " \
                        cp -r /src/. /data && \
                        k6 run /data/${env.K6_SCRIPT} \
                        "
                    """
                }
            }
        }
        
        stage('Enforce Performance Thresholds') {
            steps {
                echo 'Thresholds checked. Pipeline success requires all k6 thresholds to pass.'
            }
        }
    }
    
    post {
        always {
            deleteDir()
        }
    }
}