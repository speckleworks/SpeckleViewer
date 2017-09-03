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
      if ( message.data === 'ping' ) return this.ws.send( 'alive' )
      let parsedMessage = JSON.parse( message.data )
      switch( parsedMessage.args.eventType ) {
        case 'update-global':
          this.emit( 'update-global' )
          console.log( 'GLOBAL UPDATE YO' )
          break
        case 'update-meta':
          this.emit( 'update-meta' )
          console.log( 'METAMETA UPDATE YO')
          break
        default: 
          console.log( 'Custom event received:', parsedMessage.args.eventType )
          console.log( parsedMessage )
          this.emit( parsedMessage.args.eventType, parsedMessage.args )
          break;
      }
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

  broadcast( message ) {
    if( !this.streamId )
      throw new Error( 'No streamId, where should I broadcast?' )
    this.ws.send( JSON.stringify( { 
      eventName: 'broadcast', 
      senderId: this.clientId,
      streamId: this.streamId,
      args:  message
    } ) )
  }

  getStream( cb ) {
    axios.get( this.baseUrl + '/streams/' + this.streamId + '/meta', { headers: { 'Auth': this.auth } } )
      .then( response => {
        console.log( response.data )
        this.stream = response.data.stream
        cb( this.stream ) 
      } )
      .catch( err => {
        console.log( err )
      } )
  }

  getStreamNameAndLayers( cb ) {
    // TODO: Promise.all()
    let responseName = {}
    axios.get( this.baseUrl + '/streams/' + this.streamId + '/name', { headers: { 'Auth': this.auth } } )
    .then( response => {
      responseName = response
      return axios.get( this.baseUrl + '/streams/' + this.streamId + '/layers', { headers: { 'Auth': this.auth } } )
    })
    .then( response => {
      cb( responseName.data.name, response.data.layers )
    })
    .catch( err => {
      console.error( err )
    }) 
  }

  getStreamName( ) {
    axios.get( this.baseUrl + '/streams/' + this.streamId + '/name', { headers: { 'Auth': this.auth } } )
    .then( response => {

    })
    .catch( err => {
      console.log( err )
    })
  }

  getStreamLayers( ) {
    axios.get( this.baseUrl + '/streams/' + this.streamId + '/layers', { headers: { 'Auth': this.auth } } )
    .then( response => {

    })
    .catch( err => {

    })
  }

  getObject( objectId ) {
    axios.get( this.baseUrl + '/objects/' + objectId )
    .then( response => {

    })
    .catch( err => {
      console.log( err )
    })
  }
}