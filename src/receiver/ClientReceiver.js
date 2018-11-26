import EventEmitter from 'event-emitter-es6'

import axios from 'axios'

export default class SpeckleReceiver extends EventEmitter {
  constructor( args ) {
    super( )

    if ( !args.streamId ) throw new Error( 'No stream id provided' )
    if ( !args.baseUrl ) throw new Error( 'No stream id provided' )

    this.baseUrl = args.baseUrl
    this.token = args.token
    this.streamId = args.streamId

    this.wsUrl = this.baseUrl.replace( 'http', 'ws' )
    this.clientId = null

    this.stream = null
    this.wsReconnectionAttempts = 0

    this.setupClient( cb => this.setupWebsockets( cb => {
      this.setupWsReconnecter( )
      this.emit( 'ready' )
    } ) )
  }

  // registers an anonymous client
  setupClient( cb ) {
    axios.post( this.baseUrl + '/clients', { client: { documentName: 'Online Viewer' } }, { headers: { 'Authorization': this.token } } )
      .then( response => {
        this.clientId = response.data.resource._id
        cb( )
      } )
      .catch( err => {
        console.log( err )
      } )
  }

  disposeClient( cb ) {
    axios.delete( `${this.baseUrl}/clients/${this.clientId}` )
      .then( response => {
        this.clientId = null
        clearInterval( this.wsConnectionChecker )
        this.ws.close( )
      } )
      .catch( err => {
        console.log( err )
      } )
  }

  // sets up websockets & ws events
  setupWebsockets( cb ) {
    this.ws = new WebSocket( this.wsUrl + '/?access_token=' + this.token + '&stream_id=' + this.streamId + '&client_id=' + this.clientId )

    this.ws.onopen = ( ) => {
      console.log( 'Websocket connection opened for', this.streamId )
      if ( cb ) cb( )
    }

    this.ws.onmessage = message => {
      if ( message.data === 'ping' ) {
        return this.ws.send( 'alive' )
      }
      let parsedMessage = JSON.parse( message.data )
      switch ( parsedMessage.args.eventType ) {
        case 'update-global':
          this.emit( 'update-global' )
          break
        case 'update-meta':
          this.emit( 'update-meta' )
          break
        case 'compute-request-error':
          this.emit( 'error', parsedMessage.args.response )
          break
        case 'compute-response':
          this.childStreamId = parsedMessage.args.streamId
          this.emit( 'compute-response', this.childStreamId )
          break
        default:
          this.emit( parsedMessage.args.eventType, parsedMessage )
          break;
      }
    }

    this.ws.onclose = reason => {
      console.log( 'Websocket connection closed for', this.streamId )
    }
  }

  // sets up ws reconnecter
  setupWsReconnecter( ) {
    this.wsConnectionChecker = setInterval( ( ) => {
      if ( ( !this.ws || this.ws.readyState == 3 ) && ( this.wsReconnectionAttempts < 20 ) ) {
        this.setupWebsockets( )
        this.wsReconnectionAttempts++
      }
    }, 2000 )
  }

  broadcast( message ) {
    if ( !this.streamId )
      throw new Error( 'No streamId, where should I broadcast?' )
    this.ws.send( JSON.stringify( {
      eventName: 'broadcast',
      senderId: this.clientId,
      streamId: this.streamId,
      args: message
    } ) )
  }

  sendMessage( args, recipientId ) {
    console.log( args )
    this.ws.send( JSON.stringify( {
      eventName: 'message',
      senderId: this.clientId,
      streamId: this.streamId,
      recipientId: recipientId,
      args: args

    } ) )
  }
}
