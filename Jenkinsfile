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
                
                script {
                    def containerId
                    
                    try {
                        // 1. START CONTAINER: Use 'tail -f /dev/null' to keep the container running indefinitely. 
                        // This bypasses all previous shell and quoting failures.
                        containerId = sh(returnStdout: true, script: "docker run -d -u 0:0 grafana/k6:latest tail -f /dev/null").trim()
                        echo "k6 container started with ID: ${containerId}"
                        
                        // 2. COPY FILES: Use 'docker cp' to stream files from the Jenkins workspace into the container.
                        sh "docker cp ${WORKSPACE}/. ${containerId}:/home/k6/"
                        echo "Files copied successfully."

                        // 3. EXECUTE TEST: Use 'docker exec' to run the k6 test inside the now-running container.
                        sh "docker exec -w /home/k6 ${containerId} k6 run /home/k6/${env.K6_SCRIPT} --out influxdb=${env.INFLUXDB_HOST}"
                    } finally {
                        // 4. Clean up: Stop and remove the container whether the test passed or failed.
                        if (containerId) {
                            sh "docker stop ${containerId}"
                            sh "docker rm ${containerId}"
                            echo "k6 container cleaned up."
                        }
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
            // Fix: Clears the workspace directory to prevent corruption
            deleteDir()
        }
    }
}