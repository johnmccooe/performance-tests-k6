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
                        // 1. Start k6 container in detached mode (-d) and run a long-running command (sleep)
                        // This returns the Container ID, which we capture.
                        containerId = sh(returnStdout: true, script: "docker run -d -u 0:0 grafana/k6:latest /bin/sh -c 'sleep 3600'").trim()
                        echo "k6 container started with ID: ${containerId}"
                        
                        // 2. Use 'docker cp' to stream files from the Jenkins workspace (${WORKSPACE}) 
                        // into the running container's /home/k6 directory. This bypasses the flaky volume mount.
                        sh "docker cp ${WORKSPACE}/. ${containerId}:/home/k6/"
                        echo "Files copied successfully."

                        // 3. Execute the k6 test command inside the running container using 'docker exec'
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