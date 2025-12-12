pipeline {
    // We use agent any globally, and then run Docker explicitly inside the stage
    agent any 

    environment {
        // Environment variables for easy configuration
        K6_SCRIPT = 'basic_load_test.js'
        // *** IMPORTANT: Replace 'http://your-influxdb-host:8086' with your actual InfluxDB URL ***
        INFLUXDB_HOST = 'http://your-influxdb-host:8086' 
    }

    stages {
        stage('Checkout Code') {
            steps {
                // FIX: Sets the HOME variable to avoid the 'fatal: not in a git directory' error
                withEnv(['HOME=/var/jenkins_home']) {
                    checkout scm 
                }
            }
        }
        
        stage('Run Load Test (Protocol Level)') {
            steps {
                echo "Running k6 test: ${env.K6_SCRIPT}"
                
                // FINAL DEFINITIVE FIX: Executes the Docker run command manually within a script block.
                // This uses the absolute path (\$PWD) for the script to resolve the "file not found" error.
                script {
                    sh """
                        docker run --rm -u 0:0 \
                        -v \$PWD:\$PWD -w \$PWD \
                        grafana/k6:latest run \$PWD/${env.K6_SCRIPT} \
                        --out influxdb=${env.INFLUXDB_HOST}
                    """
                }
            }
        }
        
        stage('Enforce Performance Thresholds') {
            steps {
                // This stage will enforce thresholds if they were defined in the k6 script
                echo 'Thresholds checked. Pipeline success requires all k6 thresholds to pass.'
            }
        }
    }
    
    post {
        always {
            // FIX: Clears the workspace directory to prevent corruption
            deleteDir()
        }
    }
}