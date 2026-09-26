import javax.naming.directory.InitialDirContext;
import java.util.Hashtable;

public class Main {
    public static void main(String[] args) throws Exception {
        String value = args.length > 0 ? args[0] : "sample";
        Hashtable<String, String> env = new Hashtable<>();
        env.put("java.naming.factory.initial", "com.sun.jndi.ldap.LdapCtxFactory");
        env.put("java.naming.provider.url", "ldap://localhost:389");
        InitialDirContext ctx = new InitialDirContext(env);
        ctx.search("dc=example,dc=test", "(uid=" + value + ")", null);
    }
}
