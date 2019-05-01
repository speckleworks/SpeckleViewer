### Please note, this little piece of speckle is no longer maintained. The viewer has been integrated in [the admin interface](https://github.com/speckleworks/SpeckleAdmin). 

This repository is archived, and will not be supported going forward. 

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080.
npm run dev

# build for production with minification
npm run build
```

## Running the client

After running `npm run dev`, the client will start on localhost:8080.
By default, the client will try to connect to the server on localhost:8080/api. However, this can be overridden using
query parameters. For instance, to use the Speckle test server, go to:

`localhost:8080?server=https://hestia.speckle.works`
