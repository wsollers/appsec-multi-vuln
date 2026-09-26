import org.apache.commons.collections.map.HashedMap;

public class Main {
    public static void main(String[] args) {
        HashedMap map = new HashedMap();
        map.put("name", args.length > 0 ? args[0] : "sample");
        System.out.println(map.get("name"));
    }
}
