pipeline {
    agent any

    environment {
        APP_URL      = 'http://localhost:3000'
        MONGO_URI    = 'mongodb+srv://taskmanager_user:taskmanager2026@cluster0.f7mzmeh.mongodb.net/?appName=Cluster0'
        JWT_SECRET   = credentials('jwt-secret')          // Jenkins secret text
        TEST_IMAGE   = "taskmanager-tests:${env.BUILD_NUMBER}"
    }

    triggers {
        githubPush()   // fires automatically on every GitHub push via webhook
    }

    stages {

        // ── Stage 1: Checkout ─────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/<YOUR-USERNAME>/mern-taskmanager.git'
            }
        }

        // ── Stage 2: Install Backend ──────────────────────────────────────────
        stage('Install Backend') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }

        // ── Stage 3: Build React Frontend ────────────────────────────────────
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        // ── Stage 4: Start Application Services ──────────────────────────────
        stage('Start Services') {
            steps {
                sh '''
                    # Start MongoDB (already installed on EC2)
                    sudo systemctl start mongod || true

                    # Start the Express backend on port 5000
                    export MONGO_URI="${MONGO_URI}"
                    export JWT_SECRET="${JWT_SECRET}"
                    export PORT=5000
                    cd backend
                    nohup node server.js > /tmp/backend.log 2>&1 &
                    echo $! > /tmp/backend.pid
                    cd ..

                    # Serve the React build on port 3000
                    npx serve -s frontend/build -l 3000 > /tmp/frontend.log 2>&1 &
                    echo $! > /tmp/frontend.pid

                    # Wait up to 60 s for both ports to become ready
                    for PORT in 5000 3000; do
                        echo "Waiting for port $PORT ..."
                        for i in $(seq 1 30); do
                            nc -z localhost $PORT && echo "Port $PORT is up" && break
                            sleep 2
                        done
                    done
                '''
            }
        }

        // ── Stage 5: Build Test Docker Image ─────────────────────────────────
        stage('Build Test Image') {
            steps {
                sh "docker build -f Dockerfile.tests -t ${TEST_IMAGE} ."
            }
        }

        // ── Stage 6: Run Selenium Tests (Java / Maven) ────────────────────────
        stage('Test') {
            steps {
                sh """
                    mkdir -p test-results

                    docker run --rm \\
                        --network host \\
                        -e APP_URL=${APP_URL} \\
                        -v \$(pwd)/test-results:/app/target/surefire-reports \\
                        ${TEST_IMAGE}
                """
            }
            post {
                always {
                    // Publish JUnit XML results from Maven Surefire
                    junit allowEmptyResults: true,
                          testResults: 'test-results/*.xml'
                }
            }
        }

    } // end stages

    // ── Post-build actions ────────────────────────────────────────────────────
    post {
        always {
            sh '''
                # Stop the running application services
                kill $(cat /tmp/backend.pid)  2>/dev/null || true
                kill $(cat /tmp/frontend.pid) 2>/dev/null || true

                # Remove the test Docker image to save disk space
                docker rmi ${TEST_IMAGE} 2>/dev/null || true
            '''
        }

        success {
            emailext (
                subject: "[Jenkins] BUILD PASSED – ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
All 17 Selenium test cases (Java + JUnit 5) PASSED successfully.

Project  : ${env.JOB_NAME}
Build    : #${env.BUILD_NUMBER}
URL      : ${env.BUILD_URL}
Branch   : ${env.GIT_BRANCH}
Commit   : ${env.GIT_COMMIT}
Triggered by: ${env.GIT_COMMITTER_EMAIL}
                """,
                to: '${GIT_COMMITTER_EMAIL}',
                mimeType: 'text/plain'
            )
        }

        failure {
            emailext (
                subject: "[Jenkins] BUILD FAILED – ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
One or more Selenium test cases FAILED.

Project  : ${env.JOB_NAME}
Build    : #${env.BUILD_NUMBER}
URL      : ${env.BUILD_URL}
Branch   : ${env.GIT_BRANCH}
Commit   : ${env.GIT_COMMIT}
Triggered by: ${env.GIT_COMMITTER_EMAIL}

Review console output: ${env.BUILD_URL}console
                """,
                to: '${GIT_COMMITTER_EMAIL}',
                mimeType: 'text/plain'
            )
        }
    }
}
