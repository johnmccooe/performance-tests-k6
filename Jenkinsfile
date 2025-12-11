pipeline {
    agent {
        docker {
            image 'grafana/k6:latest'
            // CORRECT FIX: Combine all custom Docker run arguments (user, volumes, working directory) into the 'args' parameter.
            // -u 0:0 forces the container to run as root to solve the 'permission denied' socket error.
            args '-u 0:0 -v $PWD:$PWD -w $PWD' 
        }
    }

    environment {
        K6_SCRIPT = 'basic_load_test.js'
        INFLUXDB_HOST = 'http://your-influxdb-host:8086' 
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm 
            }
        }

        stage('Run Load Test (Protocol Level)') {
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
}