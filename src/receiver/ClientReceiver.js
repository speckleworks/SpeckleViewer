import EventEmitter from 'event-emitter-es6'

import axios from 'axios'

export default class SpeckleReceiver extends EventEmitter {
  constructor( args ) {
    super( )

    if ( !args.streamId ) throw new Error( 'No stream id provided' )
    if ( !args.baseUrl ) throw new Error( 'No stream id provided' )

    this.baseUrl = args.baseUrl + '/api'
    this.auth = args.auth
    this.streamId = args.streamId

    this.wsUrl = this.baseUrl.replace( 'http', 'ws' )
    this.clientId = null

    this.stream = null
    this.wsReconnectionAttempts = 0
    
    this.setupClient( cb => this.setupWebsockets( cb => this.getStream( cb => {
      console.log( this.stream )
      this.emit( 'ready', this.stream.name, this.stream.layers, this.stream.objects, [], [] )
      this.setupWsReconnecter()
    } ) ) )
  }

  setupWsReconnecter () {
    this.wsConnectionChecker = setInterval( () => {
      if( ( !this.ws || this.ws.readyState == 3 ) && ( this.wsReconnectionAttempts < 20 ) ) {
        this.setupWebsockets()
        this.wsReconnectionAttempts++
      } 
    }, 2000 )
  }

  setupWebsockets( cb ) {
    this.ws = new WebSocket( this.wsUrl + '/?access_token=' + this.auth + '&stream_id=' + this.streamId + '&client_id=' + this.clientId )

    this.ws.onopen = ( ) => {
      console.log( 'Websocket connection opened for', this.streamId )
      cb()
    }

    this.ws.onmessage = message => {
      console.log( message )
      if ( message.data === 'ping' ) return this.ws.send( 'alive' )
      let parsedMessage = JSON.parse( message.data )
      console.log( message.data )
    }

    this.ws.onclose = reason => {
      console.log( 'Websocket connection closed for', this.streamId )
    }
  }

  setupClient( cb ) {
    axios.post( this.baseUrl + '/clients', { client: { documentName: 'Online Viewer' } }, { headers: { 'Auth': this.auth } } )
      .then( response => {
        this.clientId = response.data.clientId
        cb( )
      } )
      .catch( err => {
        console.log( err )
      } )
  }

  getStream( cb ) {
    axios.get( this.baseUrl + '/streams/' + this.streamId + '', { headers: { 'Auth': this.auth } } )
      .then( response => {
        this.stream = response.data.stream
        cb() 
      } )
      .catch( err => {
        console.log( err )
      } )
  }

  getStreamName( ) {

  }

  getStreamLayers( ) {

  }

  getObject( ) {}



}