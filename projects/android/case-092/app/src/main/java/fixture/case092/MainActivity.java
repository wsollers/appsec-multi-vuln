package fixture.case092;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;

public final class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        TextView greeting = new TextView(this);
        greeting.setText(R.string.hello_world);
        setContentView(greeting);
    }
}
