package com.shixy.szlib;

import org.apache.cordova.Config;
import org.apache.cordova.DroidGap;

import android.os.Bundle;

public class MainActivity extends DroidGap {
	

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.loadUrl(Config.getStartUrl(),10000);
        
    }
    

}
