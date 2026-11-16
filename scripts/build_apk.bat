@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.21.9-hotspot"
set "PATH=%JAVA_HOME%\bin;C:\Android\Sdk\platform-tools;C:\src\flutter\bin;%PATH%"
cd travelway_app
call flutter build apk --release --android-skip-build-dependency-validation
