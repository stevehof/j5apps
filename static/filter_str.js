
//j5 encode-decode functions
;(function (){

;(function(){

// This would be the place to edit if you want a different
// Base32 implementation

var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
var alias = {};

/**
 * Build a lookup table and memoize it
 *
 * Return an object that maps a character to its
 * byte value.
 */

var lookup = function() {
    var table = {}
    // Invert 'alphabet'
    for (var i = 0; i < alphabet.length; i++) {
        table[alphabet[i]] = i
    }
    // Splice in 'alias'
    for (var key in alias) {
        if (!alias.hasOwnProperty(key)) continue
        table[key] = table['' + alias[key]]
    }
    lookup = function() { return table }
    return table
}

/**
 * A streaming encoder
 *
 *     var encoder = new base32.Encoder()
 *     var output1 = encoder.update(input1)
 *     var output2 = encoder.update(input2)
 *     var lastoutput = encode.update(lastinput, true)
 */

function Encoder() {
    var skip = 0 // how many bits we will skip from the first byte
    var bits = 0 // 5 high bits, carry from one byte to the next

    this.output = ''

    // Read one byte of input
    // Should not really be used except by "update"
    this.readByte = function(bite) {
        // coerce the byte to an int
        if (typeof bite == 'string') bite = bite.charCodeAt(0)

        if (skip < 0) { // we have a carry from the previous byte
            bits |= (bite >> (-skip))
        } else { // no carry
            bits = (bite << skip) & 248
        }

        if (skip > 3) {
            // not enough data to produce a character, get us another one
            skip -= 8
            return 1
        }

        if (skip < 4) {
            // produce a character
            this.output += alphabet[bits >> 3]
            skip += 5
        }

        return 0
    }

    // Flush any remaining bits left in the stream
    this.finish = function(check) {
        var output = this.output + (skip < 0 ? alphabet[bits >> 3] : '') + (check ? '$' : '');
        this.output = ''
        return output
    }
}

/**
 * Process additional input
 *
 * input: string of bytes to convert
 * flush: boolean, should we flush any trailing bits left
 *        in the stream
 * returns: a string of characters representing 'input' in base32
 */

String.prototype.repeat = function( num )
{
    return new Array( num + 1 ).join( this );
}

Encoder.prototype.update = function(input, flush) {
    var leftover = input.length%5
    if(leftover)
        input = input +"\0".repeat(5-leftover);
    for (var i = 0; i < input.length; ) {
        i += this.readByte(input[i])
    }
    // consume all output
    var output = this.output;
    this.output = '';
    if (flush) {
      output += this.finish();
    }
    if (leftover == 1)
         return output.slice(0,-6) + '======';
    else if(leftover == 2)
         return output.slice(0,-4) + '====';
    else if (leftover == 3)
         return output.slice(0,-3) + '===';
    else if (leftover == 4)
         return output.slice(0,-1) + '=';
    return output
}

// Functions analogously to Encoder

function Decoder() {
    var skip = 0 // how many bits we have from the previous character
    var bite = 0 // current byte we're producing

    this.output = ''

    // Consume a character from the stream, store
    // the output in this.output. As before, better
    // to use update().
    this.readChar = function(charac) {
        if (typeof charac != 'string'){
            if (typeof charac == 'number') {
                charac = String.fromCharCode(charac)
            }
        }
        //Lets actually match the correct set above!
        //charac = charac.toLowerCase()
        var val = lookup()[charac]
        if (typeof val == 'undefined') {
            // character does not exist in our lookup table
            return // skip silently. An alternative would be:
            // throw Error('Could not find character "' + char + '" in lookup table.')
        }
        val <<= 3 // move to the high bits
        bite |= val >>> skip
        skip += 5
        if (skip >= 8) {
            // we have enough to preduce output
            this.output += String.fromCharCode(bite)
            skip -= 8
            if (skip > 0) bite = (val << (5 - skip)) & 255
            else bite = 0
        }

    }

    this.finish = function(check) {
        var output = this.output + (skip < 0 ? alphabet[bits >> 3] : '') + (check ? '$' : '')
        this.output = ''
        return output
    }
}

Decoder.prototype.update = function(input, flush) {
    for (var i = 0; i < input.length; i++) {
        this.readChar(input[i])
    }
    var output = this.output
    this.output = ''
    if (flush) {
      output += this.finish()
    }
    return output
}

/** Convenience functions
 *
 * These are the ones to use if you just have a string and
 * want to convert it without dealing with streams and whatnot.
 */

// String of data goes in, Base32-encoded string comes out.
function encode(input) {
  var encoder = new Encoder()
  var output = encoder.update(input, true)
  return output
}

// Base32-encoded string goes in, decoded data comes out.
function decode(input) {
    var decoder = new Decoder()
    var output = decoder.update(input, true)
    return output
}

/**
 * sha1 functions wrap the hash function from Node.js
 *
 * Several ways to use this:
 *
 *     var hash = base32.sha1('Hello World')
 *     base32.sha1(process.stdin, function (err, data) {
 *       if (err) return console.log("Something went wrong: " + err.message)
 *       console.log("Your SHA1: " + data)
 *     }
 *     base32.sha1.file('/my/file/path', console.log)
 */

var crypto, fs
function sha1(input, cb) {
    if (typeof crypto == 'undefined') crypto = require('crypto')
    var hash = crypto.createHash('sha1')
    hash.digest = (function(digest) {
        return function() {
            return encode(digest.call(this, 'binary'))
        }
    })(hash.digest)
    if (cb) { // streaming
        if (typeof input == 'string' || Buffer.isBuffer(input)) {
            try {
                return cb(null, sha1(input))
            } catch (err) {
                return cb(err, null)
            }
        }
        if (!typeof input.on == 'function') return cb({ message: "Not a stream!" })
        input.on('data', function(chunk) { hash.update(chunk) })
        input.on('end', function() { cb(null, hash.digest()) })
        return
    }

    // non-streaming
    if (input) {
        return hash.update(input).digest()
    }
    return hash
}
sha1.file = function(filename, cb) {
    if (filename == '-') {
        process.stdin.resume()
        return sha1(process.stdin, cb)
    }
    if (typeof fs == 'undefined') fs = require('fs')
    return fs.stat(filename, function(err, stats) {
        if (err) return cb(err, null)
        if (stats.isDirectory()) return cb({ dir: true, message: "Is a directory" })
        return sha1(require('fs').createReadStream(filename), cb)
    })
}

base32 = {
    Decoder: Decoder,
    Encoder: Encoder,
    encode: encode,
    decode: decode,
    sha1: sha1
}

  // we're in a 'birt - OMGoodness!
  this.base32 = base32

}());

var encodeStr = function (input){
    return "s!" + base32.encode(input).replace(/\=/g,".");
};

var decodeStr = function (input){
    //if(input.startsWith("s!")){
    input = input.substring(2,input.length).replace(/\./g,"=");
    return  base32.decode(input);
        //return _this.base32.decode(input.substring(2,input.length).replace(".","="));
    //}
    //else{
    //    return _this.base32.decode(input.replace(".","="));
    //}
}
var decodeObj = function (input){
    input = input.replace("u!","s!");
    //creates array based on fields
    var i,outputObj = {}, inputArray = input.split(":");
    for(i in inputArray)
    {
        var f, outputArray = [], fieldArray = inputArray[i].split(",");
        for (f in fieldArray){
            outputArray.push(decodeStr(fieldArray[f]));
        }
        outputObj[outputArray.shift()] = outputArray;
    }
    return outputObj;
};
var encodeObj = function(input){
    //var inputJSON = JSON.stringify(input);
    var output = [], key;
    for (key in input){
        var i, filter = [];
        var filterArray = [key].concat(input[key]);
        for (i in filterArray){
            if(filterArray[i])
            filter.push(encodeStr(filterArray[i]))
        }
        output.push(filter.join(","));
    }
    return output.join(":");
};
j5b32 = {
    encodeObj: encodeObj,
    encodeStr: encodeStr,
    decodeStr: decodeStr,
    decodeObj: decodeObj
}
this.j5b32 = j5b32;


}());




//FROM  https://raw.github.com/agnoster/base32-js/
