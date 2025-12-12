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
                
                // FINAL ENVIRONMENTAL WORKAROUND: This single command mounts the workspace to /src, 
                // executes an internal shell script to COPY the files to a safe, non-mounted /data 
                // folder, and then runs k6 from that guaranteed-to-be-present /data location. 
                // This overcomes the environmental failure of both volume reading and process execution.
                script {
                    sh """
                        docker run --rm -u 0:0 \
                        -v \$PWD:/src \
                        grafana/k6:latest /bin/sh -c " \
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