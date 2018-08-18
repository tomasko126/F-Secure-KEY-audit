
## Security audit of F-Secure KEY & F-Secure KEY Password Manager applications
##### Date: 02/07/2017
##### by Tomáš Taro
##### tomasko126@gmail.com

***

### Table of contents

***

    - 1. Introduction
    - 2. Scope of the security audit
    - 3. Analysis
        - 4.1. F-Secure KEY analysis
            - 4.1.1. Libraries
            - 4.1.2. Local Storage
        - 4.2.
            - 4.2.1. Libraries
            - 4.2.2. Local Storage
    - 5. Finding summary
        - 5.1. F-Secure KEY vulnerabilities
        - 5.2. F-Secure Key Password Manager vulnerabilities
    - 6. Results
    - 7. Notes

***

### 2. Introduction

***

The F-Secure KEY application is a password-manager application intended for storing and/or retrieving usernames, passwords and credit card details. The application is available for Windows, macOS, iOS and Android operating systems.

The application itself is available for free, but F-Secure also offers a paid version, which includes syncing all usernames/passwords and credit card details across a range of different devices via cloud.

Users of F-Secure KEY application can also install F-Secure KEY browser extensions called "F-Secure Key Password Manager". The task of this browser extension is retrieval of particular usernames and passwords for a given website and autofill this data upon clicking on the extension's icon shown in the form fields on a website.

Both applications are being developed by the F-Secure® (https://f-secure.com) company based in Finland.

***

### 3. Scope of the security audit

***

The following applications will be tested for any potential security vulnerability:
- F-Secure KEY desktop application
- F-Secure KEY Password Manager browser extensions (available for Google Chrome & Mozilla Firefox browsers)

I will mainly focus on how all login details are stored on user's device, how the communication between KEY and browser extensions works and last but not least, how browser extensions injects data to login fields.

This security audit will be performed on a macOS machine with installed latest OS and up-to-date Google Chrome browser on it.

***

### 4. Analysis

***

In order to get more details, how both applications (desktop application and related browser extensions) were implemented, the extraction of theirs source code was needed.

For F-Secure KEY's source code retrieval, I used a simple hex editor application called "Hexfiend" (https://github.com/ridiculousfish/HexFiend).

For source code retrieval of the browser extension, I simply visited "Chrome Web Store" (an online store, where users of Google Chrome browser can download extensions, apps & themes) via Google Chrome browser, downloaded the F-Secure KEY Password manager extension in a .zip file format and extracted its content afterwards.

After that, I began analysing the source code of both applications.

***

#### 4.1. F-Secure KEY analysis

***

After a further analysis of KEY's source code, I have found out that the application was developed using a cross-platform Qt framework. The application itself uses QTWebkit framework for rendering its content, so technically the F-Secure KEY is a web application. That means that the content of the application is written in HTML, uses CSS for styling and utilises JavaScript programming language.

Since JavaScript is a scripted language and not a compiled one, almost all front-end code was readable (except the Javascript to C++ bindings), thus I was only able to reverse-engineer the JavaScript code of this application.

I have found out, that the application stores usernames/passwords/credit card details in a SQLite database file with some additional important application data. Before those data are stored, they are encrypted by using PBKDF2 hash algorithm.

From the UI perspective, the application will automatically lock after 5 minutes by default (this can be changed) and must be unlocked by typing a master password, which was created after opening the application for the very first time. User has also an option to create a recovery image, so he can access the app's content without knowing the master password.

##### 4.1.1 Libraries

***

Analysing the source code revealed, that the application uses the following libraries:
- QT + QTWebkit, version 5.5
- OpenSSL, version 1.0.2f

The QTWebkit framework was deprecated in favour of QTWebEngine in 2013 and is not being actively maintained.
Although it doesn't contain any known security vulnerability after searching in CVE database, the recommended approach is using QTWebEngine instead of QTWebkit.
Ref: https://github.com/qt/qtwebkit/commits/dev

The OpenSSL 1.0.2f version is known to have some serious vulnerabilities of the highest score 10, per cvedetails.com.
Ref: https://www.cvedetails.com/vulnerability-list/vendor_id-217/product_id-383/Openssl-Openssl.html

I recommend updating all used libraries to the latest version, and never use libraries that are officially marked as “no longer maintained” by the library author.

##### 4.1.2 Local Storage

***

The application stores user's usernames/passwords and credit card details in a SQLite database,
which path on macOS is "/Users/<username>/Library/Application Support/F-Secure/Pwmgr" and is called "file__0.localstorage".

***

#### 4.2 F-Secure KEY Password Manager & communication with KEY app analysis

***

The F-Secure Key Password Manager extension for Google Chrome browser was easier to reverse-engineer than F-Secure KEY applications, because I have successfully obtained the full source code. I was trying to understand, how the extension communicates with the F-Secure KEY applications and if auto-filling the appropriate username/password cannot be defeated.

The extension communicates with the KEY application via a localhost server (port 24166), which starts up after enabling "Enable browser autofill" option in KEY application.

The KEY application generates a hash (aka "authorisation code"), which needs to be copied and pasted into an extension, in order to begin communicating with the KEY app.

Subsequently, the extension can lock/unlock the KEY application and request usernames/passwords/credit card details from the KEY application's storage.

When KEY application is locked, the extension can still make an API request to the KEY application in order to obtain username/password/credit card details, but the request will return "Unauthorised" response status.

##### 4.2.1 Libraries

***

Analysing the browser extension revealed, that the extension uses 1 library, namely:
- jQuery, version 1.10.2

This particular jQuery framework contains 1 known XSS vulnerability.
Ref: https://github.com/jquery/jquery/issues/2432

I recommend updating the jQuery framework to the latest version available.

##### 4.2.2 Local Storage

***

The extensions stores the authentication token (generated by F-Secure KEY application) in a storage offered by Chrome API in chrome.storage namespace.

### 5. Finding summary

***

After hours of studying the source codes of both applications, trying to understand what each piece of code is intended to do, I have found 4 vulnerabilities in the F-Secure KEY application and 3 vulnerabilities in F-Secure Key Password Manager for Chrome extension.

#### 5.1 F-Secure KEY vulnerabilities

***

The F-Secure KEY application contains following vulnerabilities:

1.) The content of the SQLite3 database is not encrypted, which leads to information disclosure.

Application's database contains information such as hashed usernames/passwords/credit card details, salt used in PBKDF2 hash algorithm, important application's settings etc. are visible.
Changing the database data can lead to a Denial of Service, nonfunctional application or loss of data.

Solution: Encrypting this database by user's master password is recommended.

2.) The application doesn't check the origin of requests coming from the Chrome extension
When F-Secure KEY Password Manager "asks" (aka sends a request to) F-Secure KEY application for username/password, the application doesn't check, whether the particular request is trusted (aka coming from a trusted origin). This bug helps with debugging & reverse engineering of both F-Secure KEY and KEY Password Manager apps and applies to every request coming from the Chrome extension.

Solution: I recommend checking requests against a known official extension ID, which is set in the Origin Header.

3.) The application incorrectly checks for a sent domain in request asking for credentials

When F-Secure KEY Password Manager requests usernames/passwords from KEY application after clicking on F-Secure KEY logo found in the website's username form, KEY incorrectly checks, for which domain it should return usernames.

Example:

Stored credentials in KEY app:
- for domain: twitter.com; login: xyz pass: xyz
- for domain: mtwitter.com; login: xyz pass: xyz

If you visit "ter.com" webpage in Chrome browser and click on the KEY Password Manager icon in the login fields, the extension shows stored password for "twitter.com" and "mtwitter.com", although those passwords belong to different domains.

Solution: A better check for domains/sub-domains has to be implemented.

***

#### 5.2 F-Secure Key Password Manager vulnerabilities

***

The F-Secure KEY Password Manager contains the following vulnerabilities:

1.) The extension stores an authentication token in an unencrypted storage

This makes the authentication token visible to other applications installed on the machine.

Solution: Google Chrome does not offer an encrypted storage for extensions, thus making this unable to fix.

2.) The extension doesn't check, whether "click" events were made programatically or by user action

Any website could programatically click on the Password Manager's button in the login field and fill the login data with information provided by KEY application.

Solution: I recommend checking against Event.isTrusted in order to fix this bug.

3.) The extension injects its content scripts into every document frame.

With combination of 5.1 3) and 5.2 2) security vulnerabilities, an unauthorised attacker could successfully obtain user's login credentials (from only one website) by visiting a crafted website. However, by leveraging this security bug, an unauthorised attacked could obtain user's login credentials (which are stored in KEY app) from multiple websites, just by visiting one crafted website.

Example: top-frame website: ok.com
         sub-frame website: ter.com
         ..
         ..
         ..

Also assume, that user would also have stored passwords for facebook.com and twitter.com websites.
By visiting a crafted website "ok.com", which would also load an iframe with "ter.com" domain, an attacker could steal usernames/passwords from both websites quite easily.

Solution: I recommend running extension's script in a main top-frame only, in order to mitigate this bug.

***

### 6. Results

***

With combination of 5.1 3), 5.2 2) and 5.2 3) security vulnerabilities, an unauthorised attacker could potentially obtain user's login credentials from multiple websites by visiting a crafted website.

***

### 7. Notes

***

I was testing the latest versions of both apps, namely F-Secure KEY 4.5.116 & F-Secure KEY Password Manager for Chrome 0.9.7.
Both apps were installed from official channels, the extension was installed from Chrome Web Store and the KEY application from https://f-secure.com.

The domains "ok.com" and "ter.com" do NOT belong to the creator of this security audit (Tomáš Taro).
Both domains were included for self-testing purposes of security bugs found and described in this security audit.