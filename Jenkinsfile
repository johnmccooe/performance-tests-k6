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
                // Ensures SCM content is pulled into the Custom Workspace (e.g., C:\k6_project).
                withEnv(['HOME=/var/jenkins_home']) {
                    git url: 'https://github.com/johnmccooe/performance-tests-k6.git', branch: 'main'
                }
            }
        }
        
        stage('Run Load Test (Protocol Level)') {
            steps {
                echo "Running k6 test: ${env.K6_SCRIPT}"
                
                script {
                    // FINAL FIX: Using $WORKSPACE to ensure the path variable contains the 
                    // Windows path (e.g., C:\k6_project), which Docker Desktop is configured to read.
                    sh """
                        docker run --rm -u 0:0 \
                        --entrypoint "/bin/sh" \
                        -v $WORKSPACE:/src \
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
            // Clears the workspace directory
            deleteDir()
        }
    }
}