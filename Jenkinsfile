pipeline {
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
                // Fix: Sets the HOME variable to avoid the 'fatal: not in a git directory' error
                withEnv(['HOME=/var/jenkins_home']) {
                    checkout scm 
                }
            }
        }
        
        stage('Run Load Test (Protocol Level)') {
            steps {
                echo "Running k6 test: ${env.K6_SCRIPT}"
                
                // ABSOLUTE FINAL FIX: Uses --entrypoint "/bin/sh" to ensure the shell script runs first, 
                // overriding the default 'k6' entrypoint, which was causing the "unknown command" error.
                script {
                    sh """
                        docker run --rm -u 0:0 \
                        --entrypoint "/bin/sh" \
                        -v \$PWD:/src \
                        grafana/k6:latest -c " \
                        cp -r /src/. /data && \
                        k6 run /data/${env.K6_SCRIPT} --out influxdb=${env.INFLUXDB_HOST} \
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
            // Fix: Clears the workspace directory to prevent corruption
            deleteDir()
        }
    }
}