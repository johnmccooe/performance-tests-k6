pipeline {
    agent any 

    environment {
        K6_SCRIPT = 'basic_load_test.js'
        INFLUXDB_HOST = 'http://your-influxdb-host:8086' 
    }

    stages {
        stage('Checkout Code') {
            steps {
                // CRUCIAL GIT FIX: Force Git to use the standard Jenkins home directory for its configuration.
                withEnv(['HOME=/var/jenkins_home']) {
                    checkout scm 
                }
            }
        }
        
        stage('Run Load Test (Protocol Level)') {
            agent {
                docker {
                    image 'grafana/k6:latest'
                    args '-u 0:0 -v $PWD:$PWD -w $PWD' 
                }
            }
            steps {
                echo "Running k6 test: ${env.K6_SCRIPT}"
                sh "k6 run ${env.K6_SCRIPT} --out influxdb=${env.INFLUXDB_HOST}" 
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
            // CRUCIAL CLEANUP FIX: Deletes the workspace content after every run (since Wipe button is unavailable)
            deleteDir()
        }
    }
}