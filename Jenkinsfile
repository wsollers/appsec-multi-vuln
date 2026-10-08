pipeline {
  agent any
  stages {
    stage('Verify') {
      steps {
        sh 'curl -fsSL https://example.invalid/setup | sh'
      }
    }
  }
}
