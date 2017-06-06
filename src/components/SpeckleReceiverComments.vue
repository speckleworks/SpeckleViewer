<template>
  <div class='receiver-comments'>
    <div class='comments-head'>
      <div class="md-caption">
        Hello {{user.name}}, <span v-if='comments.length === 0'>there are no comments so far.</span> <span v-else>there are {{comments.length}} comment(s) so far.</span>
        <div v-if='user.guest' class='login-click'@click='toggleLogin'>Login to comment.</div>
      </div>
      <br>
      <div v-if='user.guest === false'>
        <md-input-container style='margin:0'>
          <label>Your comment</label>
          <md-textarea v-model='newCommentText'></md-textarea>
        </md-input-container>
        <md-button class='md-dense md-raised' style='left:-6px;' @click.native='submitComment'>submit</md-button>
      </div>
    </div>
    <div class='receiver-comments-list'>
      <div v-for='comment in comments' class='comment' @click='setView(comment.camera)'>
        <span class='comment-author'>{{comment.author.name == user.name ? 'You :' : comment.author.name + ' said:'}}</span>
        <span class='comment-text'>{{comment.text}}</span>
      </div>
      <br>
      <md-chip v-show='comments.length > maxComments' @click.native='maxComments += comments.length'>Show all comments ({{comments.length}})</md-chip>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SpeckleReceiverComments',
  props: ['streamid'],
  computed: {
    user() {
      return this.$store.getters.user
    },
    comments() {
      return this.$store.getters.receiverComments( this.streamid )
    }
  },
  data() {
    return {
      newCommentText: '',
      maxComments: 100
    }
  },
  methods: {
    toggleLogin( ) {
      bus.$emit('app-show-login')
    },
    setView( where ) {
      bus.$emit( 'renderer-setview', where )
    },
    submitComment() {
      if( this.newCommentText === '' ) return
      let newComment = {
        author: { name: this.user.name, id: this.user._id },
        camera: window.camLoc,
        text: this.newCommentText,
        timestamp: Date.now()
      }
      this.newCommentText = ''
      this.$emit('comment-submit', newComment )
    }
  }
}
</script>

<style scoped>
.login-click {
  color: #0080FF;
  cursor: pointer;
}
.comments-head{ 
  box-sizing: border-box;
  padding: 5px 20px;
  margin-top: 10px;
}
.receiver-comments {
}
.receiver-comments-list {
  margin-top: 10px;
  padding-top: 10px;
  /*border-top: 1px solid #CCCCCC;*/
  max-height: 400px;
  overflow: auto;
}
.comment {
  position: relative;
  margin-top: 10px;
  width: 90%;
  left: 3%;
  box-sizing: border-box;
  padding: 5px 20px;
  background-color: #E6E6E6;
  border-radius: 30px;
  font-size: 12px;
  transition: all .3s ease;
  cursor: pointer;
}

.comment:hover{
  background-color: #B3B3B3;
}

.comment-author{
  /*background-color: white;*/
  font-weight: bold;
  padding: 2px;
}
</style>