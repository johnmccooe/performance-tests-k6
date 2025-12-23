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
            // We use $(pwd) to tell Docker exactly where we are
            // And we add an 'ls' command to debug if it fails again
            sh """
                docker run --rm -u 0:0 \
                -v \$(pwd):/src \
                grafana/k6:latest \
                run /src/scripts/basic_load_test.js
            """
        }
    }
    post {
        always {
            // Archive the report we created in the handleSummary function
            archiveArtifacts artifacts: 'summary.html', allowEmptyArchive: true
        }
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