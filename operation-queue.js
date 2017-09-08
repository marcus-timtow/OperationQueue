;
(function (name, definition) {
    if (typeof define === "function" && typeof define.amd === "object") {
        define(definition);
    } else if (typeof module !== "undefined") {
        module.exports = definition();
    } else {
        this[name] = definition();
    }
}("OperationQueue", function () {

    let OperationQueueError = function (errmsg) {
        if (typeof errmsg === "string") {
            this.message = errmsg;
        } else if (errmsg && errmsg.message) {
            this.message = errmsg.message;
            this.error = errmsg;
            this.stack = errmsg.stack;
        } else {
            this.message = "Unknown Error";
        }
    };
    OperationQueueError.prototype = {};
    OperationQueueError.prototype.name = "[OperationQueueError]";
    OperationQueueError.prototype.toString = function () {
        return this.name + " " + this.message;
    };
    OperationQueueError.prototype.toJSON = function () {
        return {
            message: this.message,
            error: this.error,
            stack: this.stack,
            name: this.name
        };
    };

    /**
     * When the different operations which can be executed on a specific object depends on an object 
     * state, a solution to keep a consistent state at any point of the object lifecyle is
     * to queue the different operations executed. This way any operation (which can potentially
     * change the state of the object) is ensured that the state it tests before its execution 
     * will remain the same for the whole duration of its execution.
     * 
     * An operation queue keeps operation in different states:
     *  * pending - the operation is queued, waiting for the operations queued before it to complete
     *  * running - the operation is being executed
     * 
     * @argument {object} options 
     *  * shiftError: boolean = false : Never set err as first callback argument
     *  * logerr: false|null|function = console.error
     *  * log: false|null|function = console.log
     *  * debug: boolean = false
     *  * namespace: string
     * 
     * @returns {OperationQueue}
     */
    let OperationQueue = function (options = {}) {
        this.busy = false; // flag: an operation is running
        this.current = 1; // the running operation id

        this.aborted = false; // flag: the queue was aborted
        this.operations = []; // pending operations
        /**
         * @see `drop()`
         * 
         * The mechanism used to drop only the pending operations while still accepting future
         * operations is for each pending operation to keep the value of the dropped flag at which the operation
         * was inserted queued and then to compare it to its value before being executed.
         */
        this.dropped = 0;

        this.logerr = options.hasOwnProperty("logerr") ? options.logerr : console.error.bind(console);
        this.shiftError = options.ignoreError || options.shiftError;
        this.debug = typeof options.debug === "boolean" ? options.debug : false;
        this.log = options.log || console.log.bind(console);
        this.namespace = options.namespace || null;
    };
    OperationQueue.prototype = {};
    OperationQueue.prototype.toString = function () {
        return "[OperationQueue"+ (this.namespace ? (":" + this.namespace) : "") +"]";
    };

    OperationQueue.prototype.shift = function () {
        if (this.busy || this.operations.length === 0) {
            return;
        }
        (this.operations.shift())();
    };
    
    OperationQueue.prototype.queue = function (operation, options, callback, _priority) {
        if (typeof options === "function") {
            _priority = callback;
            callback = options;
            options = null;
        }
        let logoptions, logname;
        options = options || (!(logoptions = false) && {});
        _priority = typeof _priority === "number" ? Math.max(Math.min(_priority, this.operations.length), 0) : this.operations.length;

        if (this.debug) {
            logname = options.name || operation.name || "anonymous operation";
            logoptions = logoptions ? JSON.stringify(options) : "";
            this.log(this + " queued("+ _priority +") " + logoptions + ": " + logname);
        }

        let that = this;

        let shiftError = options.hasOwnProperty("shiftError") ? options.shiftError : this.shiftError;
        let wrap = function (foo, err, value) {
            try {
                foo(err, value);
            } catch (err) {
                that.logerr && that.logerr(new OperationQueueError(err));
            }
        };

        return new Promise(function (resolve, reject) {
            let current, dropped = that.dropped;

            let next = function (err, value) {
                if (that.debug) {
                    let logargs = "(" + (shiftError ? value : (err + ", " + value)) + ")";
                    that.log(that + " completed " + logoptions + ": " + logname + ": " + logargs);
                }

                callback && wrap(callback, shiftError ? value : err, shiftError ? undefined : value);
                if (err) {
                    wrap(reject, err);
                } else {
                    wrap(resolve, value);
                }

                if (that.current === current) {
                    that.busy = false;
                    that.shift();
                }
            };

            that.operations.splice(_priority, 0, function () {
                that.busy = true;
                current = ++that.current;

                if (that.aborted) {
                    next(that.abortedError);
                } else if (dropped !== that.dropped) {
                    next(that.droppedError);
                } else {
                    try {
                        operation(next);
                    } catch (err) {
                        that.logerr && that.logerr(new OperationQueueError(err));
                        next(err);
                    }
                }
            });

            that.shift();
        });
    };
    
    OperationQueue.prototype.push = function(operation, options, callback){
        return this.queue(operation, options, callback);
    };
    
    OperationQueue.prototype.unshift = function(operation, options, callback){
        return this.queue(operation, options, callback, 0);
    };
    
    /**
     * Abort all pending and future operations
     * 
     * @argument {Error} errmsg : An error to be passed to the abortion callbacks.
     */
    OperationQueue.prototype.abort = function (errmsg) {
        this.aborted = true;
        this.abortedError = new OperationQueueError(errmsg);
        this.debug && this.log(this + " aborted: " + this.abortedError);
    };
    /**
     * Abort all pending operations, but accept future ones.
     * 
     * @argument {Error} errmsg : An error to be passed to the abortion callbacks.
     */
    OperationQueue.prototype.drop = function (errmsg) {
        this.dropped++;
        this.droppedError = new OperationQueueError(errmsg);
        this.debug && this.log(this + " dropped (" + this.dropped + "): " + this.droppedError);
    };

    return OperationQueue;
}));

