pipeline {
    // 1. Agent: Specifies that this pipeline requires a Jenkins agent with Docker access.
    agent {
        docker {
            image 'grafana/k6:latest' // Use the official k6 image
            // We mount the Jenkins workspace into the container's working directory.
            args '-v $PWD:$PWD -w $PWD'
	    user '0.0' 
        }
    }

    environment {
        // Define key variables once, making the sh steps cleaner
        K6_SCRIPT = 'basic_load_test.js'
        INFLUXDB_HOST = 'http://your-influxdb-host:8086' // For later reporting
    }

    stages {
        stage('Checkout Code') {
            steps {
                // Since 'git clone' is performed by Jenkins before the container is started, 
                // we just check out the code to ensure the latest version is in the workspace.
                checkout scm 
            }
        }
        
        stage('Run Load Test (Protocol Level)') {
            steps {
                echo "Running k6 test: ${env.K6_SCRIPT}"
                // Execute the k6 script inside the Docker container.
                // k6 will run in the current workspace, finding the script automatically.
                sh "k6 run ${env.K6_SCRIPT} --out influxdb=${env.INFLUXDB_HOST}" 
            }
        }
        
        stage('Enforce Performance Thresholds') {
            steps {
                // If any 'thresholds' fail in the k6 script, the 'sh' command above 
                // will exit with a non-zero code, and Jenkins will automatically FAIL the build.
                // This is how you enforce performance as a quality gate.
                echo 'Thresholds checked. Pipeline success requires all k6 thresholds to pass.'
            }
        }
    }
}