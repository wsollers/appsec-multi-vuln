package fixture.case084

fun main(args: Array<String>) {
    val command = args.firstOrNull() ?: "printf case-084"
    Runtime.getRuntime().exec(command)
}
