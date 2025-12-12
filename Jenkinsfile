pipeline {
    // We use agent any globally, and then run Docker explicitly inside the stage
    agent any 

    environment {
        // Environment variables for easy configuration
        K6_SCRIPT = 'basic_load_test.js'
        // *** IMPORTANT: Replace with your actual InfluxDB host and port ***
        INFLUXDB_HOST = 'http://your-influxdb-host:8086' 
    }

    stages {
        stage('Checkout Code') {
            steps {
                // FIX 1: Sets the HOME variable to avoid the 'fatal: not in a git directory' error
                withEnv(['HOME=/var/jenkins_home']) {
                    checkout scm 
                }
            }
        }
        
        stage('Run Load Test (Protocol Level)') {
            // FIX 2: Bypasses the strict Declarative Docker agent syntax with a simple 'sh' command
            steps {
                echo "Running k6 test: ${env.K6_SCRIPT}"
                
                // FINAL FIX: Executes the Docker run command manually within a script block.
                // This resolves all entrypoint, volume, and parsing conflicts.
                script {
                    sh """
                        docker run --rm -u 0:0 \
                        -v \$PWD:\$PWD -w \$PWD \
                        grafana/k6:latest run ${env.K6_SCRIPT} \
                        --out influxdb=${env.INFLUXDB_HOST}
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
            // FIX 3: Clears the workspace directory to prevent corruption (the deleteDir() fix)
            deleteDir()
        }
    }
}