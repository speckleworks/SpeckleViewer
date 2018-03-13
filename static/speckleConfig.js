var SpkAppConfig = {
  // If developing locally and you want to use a live server
  // that's a different url address than window.location.origin,
  // use this & append a `,dev` to  your final url.
  // ie: http://localhost:8888/?r1FUgY99G,dev
  // This is obviously a stop gap solution.
  serverUrl: 'http://104.131.39.3:3000/api',
  allowGuestAccess: true,
  logoUrl: 'https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2017-04-04/164468419442_9561f3ab8bcd823ebe33_132.png'
}

window.SpkAppConfig = SpkAppConfig
