# doordash-analyzer

Tells you how much money you've spent with Doordash during the pandemic

## Installation

Clone the repo and install the dependencies:

```
git clone git@github.com:bertrandom/doordash-analyzer.git
cd doordash-analyzer
npm install
```

## Usage

Open Google Chrome and go to [https://www.doordash.com](Doordash). Click "Sign In" in the top-right and sign-in to your account.

Run:
```
node app
```

On OS X, this module requires Keychain Access to read the Google Chrome encryption key. The first time you use it, it will popup this dialog:

![image](https://raw.githubusercontent.com/bertrandom/chrome-cookies-secure/gh-pages/access.png)

Clicking Allow will let it extract the Doordash cookies from Chrome and calculate how much you've spent.

# License

This software is free to use under the MIT license. See the LICENSE file for license text and copyright information.