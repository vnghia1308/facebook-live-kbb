/**
 * State controller controls the state of the app for a single stream
 */
var StateController = function(streamId, errorHandler, endCallback) {
	$("#title").html("Stream connected")
    this.streamId = streamId;
    this.endCallback = endCallback;
        
    /* 
     * The breakpoint where we stop iterating; since comments are in reverse chronological order
     * we only have to iterate until the last time that we iterated
     */
    this.commentIdBreakpoint = null;
    
    var that = this;
    
    this.interval = setInterval(function(){ 
        //first make sure stream is still live
        that.checkLiveStatus(streamId)
        .done(function() {
            FB.api(
                "/" + streamId + "/comments",
                {
                    order : 'reverse_chronological'
                },
                function (response) {                
                    if (response && !response.error) {
                        //we want to keep adding comments to the top
                        //as long as they have not already been added
                        if(response.data.length > 0) {
							loopMatching();
                            var i = 0;
                            var comment = response.data[i];
                            //since iterating in reverse chronological order, first comment is the most recent one; save it off
                            var mostRecentComment = comment.id;
                                                        
                            while(i < response.data.length && comment.id != that.commentIdBreakpoint)
                            {
								add_player([comment.from.name, comment.from.id]);
								
                                ++i;
                                comment = response.data[i];
                            }         
                            
                            that.commentIdBreakpoint = mostRecentComment;
                        }
                    }
                    else {
                        errorHandler(response.error);
                    }
                }
            );
        })
        .fail(function(err) {
            if(err) {
               errorHandler(err);
            } 
            //otherwise we're just done and should clear interval
            that.stopPolling();
        });
        
    }, 2000 /*2 seconds*/);
}

StateController.prototype.checkLiveStatus = function(streamId) {
    var dfd = $.Deferred();
    FB.api(
        "/" + streamId,
        function (response) {   
            if (response && !response.error) {
                if(response.status == 'LIVE') {
                    dfd.resolve();
                }
                else {
                    dfd.reject();
                }
            }
            else {
                dfd.reject(response.error);
            }
        }
    );
    
    return dfd.promise();
}
/**
 * Stops polling and cleans up a state controller
 */
StateController.prototype.stopPolling = function() {
    clearInterval(this.interval);
    if(this.endCallback) {
        this.endCallback();
    }
}