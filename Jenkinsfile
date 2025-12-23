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
            script {
                // Added -v to map the local folder so the HTML file persists
                sh "docker run --rm -u 0:0 -v ${WORKSPACE}:/src grafana/k6:latest run /src/scripts/basic_load_test.js"
            }
        }
        post {
            always {
                // This makes the file clickable in the Jenkins UI
                archiveArtifacts artifacts: 'summary.html', fingerprint: true
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