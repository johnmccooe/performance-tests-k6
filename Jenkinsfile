stages {
        stage('Fix Docker Socket Permissions') {
            steps {
                echo "Temporarily modifying Docker socket permissions for DinD access..."
                // CRUCIAL: Run chmod 666 on the socket to grant all users (including Jenkins) read/write access.
                // This is a common, non-permanent workaround for DinD permission issues.
                sh 'sudo chmod 666 /var/run/docker.sock'
            }
        }
        
        stage('Checkout Code') {
            steps {
                checkout scm 
            }
        }
        
        stage('Run Load Test (Protocol Level)') {
            steps {
                echo "Running k6 test: ${env.K6_SCRIPT}"
                // The k6 agent will run here, and the socket should now be accessible.
                sh "k6 run ${env.K6_SCRIPT} --out influxdb=${env.INFLUXDB_HOST}" 
            }
        }
        
        stage('Enforce Performance Thresholds') {
            steps {
                echo 'Thresholds checked. Pipeline success requires all k6 thresholds to pass.'
            }
        }
    }
}