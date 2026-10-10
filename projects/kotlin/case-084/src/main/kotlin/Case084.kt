package fixture.case084

// Synthetic CWE-78: untrusted input reaches an operating-system command API.
fun main(args: Array<String>) {
    val command = args.firstOrNull() ?: "printf case-084"
    Runtime.getRuntime().exec(command)
}
