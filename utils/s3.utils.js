const { v4: uuidv4 } = require('uuid');

var S3 = require('aws-sdk/clients/s3');

const s3 = new S3({
    params: {Bucket: process.env.AWS_BUCKET_NAME},
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

const uploadBase64AsImageFile = (qr) => {
    let key = `${uuidv4()}.jpeg`;
    
    var buf = Buffer.from(qr.replace(/^data:image\/\w+;base64,/, ""),'base64')
    var data = {
      Key: key, 
      Body: buf,
      ContentEncoding: 'base64',
      ContentType: 'image/jpeg'
    };

    return new Promise((resolve, reject)=>{
        s3.putObject(data, function(err, data){
            if (err) { 
              console.log(err);
              console.log('Error uploading data: ', data); 
            } else {
              console.log('successfully uploaded the image!');
              resolve(`https://noudada.s3.amazonaws.com/${key}`)
            }
        });
    })

}

module.exports = {
    uploadBase64AsImageFile
}

// uploadBase64AsImageFile("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAAAAklEQVR4AewaftIAAAd8SURBVO3BQY4cy5LAQDLR978yR0tfBZCoaj39GDezP1jrEg9rXeRhrYs8rHWRh7Uu8rDWRR7WusjDWhd5WOsiD2td5GGtizysdZGHtS7ysNZFHta6yMNaF/nhQyp/U8WJylRxojJVvKEyVUwqU8WJyn+pYlL5myo+8bDWRR7WusjDWhf54csqvknlEypTxRsqJxWTym+qmFT+popvUvmmh7Uu8rDWRR7WusgPv0zljYo3VKaKNyq+qeKbKiaVk4pJZar4JpU3Kn7Tw1oXeVjrIg9rXeSH/+dUTireUDmpOKmYVKaKSWVSmSr+P3lY6yIPa13kYa2L/HA5laliqjhRmSomlZOKSeWkYqqYVKaKT6hMFf/LHta6yMNaF3lY6yI//LKKv0nlmyomlaliUjmpOFGZKqaKSWWqmFR+U8W/5GGtizysdZGHtS7yw5ep/JcqJpUTlaliUpkqJpWpYlKZKiaVqWJSmSo+UTGpvKHyL3tY6yIPa13kYa2L/PChin+JylRxUvGJiknlRGWqmFS+qWJSmSpOKv6XPKx1kYe1LvKw1kV++JDKVDGpfFPFVPFNKlPFpHJS8YmKE5U3VKaKN1S+qeI3Pax1kYe1LvKw1kV++FDFGxUnKlPFpDJVTCpvVEwVb1ScqEwVJyonFScqU8XfVDGpTCpTxTc9rHWRh7Uu8rDWRewPPqAyVZyofKJiUpkqJpWp4kTlExWfUJkqJpVPVEwqJxVvqEwVk8pJxSce1rrIw1oXeVjrIvYHv0jlExWTyhsVJyqfqPiEyhsVk8pUMalMFZPKVPFNKicV3/Sw1kUe1rrIw1oXsT/4h6i8UXGiclJxonJSMam8UXGiMlWcqLxRMamcVEwqU8WJylTxTQ9rXeRhrYs8rHWRHz6k8omKk4pJZVKZKqaKSeVEZaqYVE4qTlQmlaliqphUTiomlaliUpkqTlSmin/Jw1oXeVjrIg9rXeSHL6uYVKaKk4pJ5aTimypOKiaVqWJSmSpOVE4qJpWTikllqphUTiomlanipOI3Pax1kYe1LvKw1kV++MtU3qiYVP5LKlPFScWJylRxovKJiknlDZVvUpkqPvGw1kUe1rrIw1oX+eFDFW9UvKHyCZWp4kTlm1SmihOVqWKqOFGZKk4qvknljYpveljrIg9rXeRhrYvYH3yRylRxonJScaIyVZyoTBUnKm9UfEJlqjhRmSreUPmbKn7Tw1oXeVjrIg9rXcT+4BepnFScqHyi4g2VqeKbVE4qTlSmijdUpopJ5aTiRGWqmFROKj7xsNZFHta6yMNaF/nhQypTxUnFGxWTylQxqUwqU8WkMlVMKlPFpDJVTCpvqJxUTCpTxaTyiYpJ5aRiUpkqftPDWhd5WOsiD2tdxP7gAyonFScqn6h4Q+Wk4hMqJxWTylQxqZxUTCpvVEwqJxWTyknFpDJVfNPDWhd5WOsiD2tdxP7gL1I5qXhD5b9UMalMFZPKVPGGyknFpDJVnKhMFf9LHta6yMNaF3lY6yL2B1+kclJxonJS8YbKVDGpnFRMKlPFpDJVnKicVLyh8jdVTCpTxYnKVPGJh7Uu8rDWRR7WusgPv6xiUnmjYlI5qZgqJpWpYlL5JpWTiknlROWk4ptUpoqTiv/Sw1oXeVjrIg9rXcT+4AMqU8U3qUwVJypTxW9SmSreUDmpeENlqnhDZap4Q+WkYlKZKj7xsNZFHta6yMNaF/nhy1TeqJhUpopJZaqYKiaVqWJSmSomlZOKSeWNiknlDZWp4kTlDZU3KiaVk4pveljrIg9rXeRhrYv88GUV36RyovKGyjepTBWTyhsVn1CZKk4qTlSmihOVqWJSOan4xMNaF3lY6yIPa13kh1+mclJxUjGpTBWTyhsVn6h4o+JE5aTipOKbKiaVqWKqmFSmit/0sNZFHta6yMNaF7E/+IDKVDGpnFScqLxRMam8UXGi8kbFicpUcaIyVUwqU8WJym+qmFROKj7xsNZFHta6yMNaF/nhQxUnFZ+oOFGZVE4qvqniROWkYlJ5Q2WqOFE5qXhD5V/ysNZFHta6yMNaF/nhQyp/U8VUcaLyCZVvqphUpoo3VCaVk4pJ5URlqjip+C89rHWRh7Uu8rDWRX74sopvUjlROak4UZkqpopJ5Y2KSWWqmFSmikllqvhNFd9UMal808NaF3lY6yIPa13kh1+m8kbFJyr+JSpTxScqJpVvUvmEyn/pYa2LPKx1kYe1LvLD5VSmiqliUpkqTlSmiqliUjmpmFSmijcqTlTeqJhUpopJZar4TQ9rXeRhrYs8rHWRH/6fUflExScqTlSmik+oTBUnFScqU8VJxYnKVPGJh7Uu8rDWRR7WusgPv6ziN1WcVJyoTBVvqEwVk8pU8QmVk4pJZVKZKk5UpooTlZOK3/Sw1kUe1rrIw1oX+eHLVP4mlaliUpkq/iUqU8VJxYnKVDGpTCpvqEwVJxWTym96WOsiD2td5GGti9gfrHWJh7Uu8rDWRR7WusjDWhd5WOsiD2td5GGtizysdZGHtS7ysNZFHta6yMNaF3lY6yIPa13kYa2L/B8UaANI6mycXgAAAABJRU5ErkJggg==")



// https://noudada.s3.amazonaws.com/be0b8d3b-331c-41ea-b001-0315a45739c4.jpeg - not workin
// https://noudada.s3.amazonaws.com/be0b8d3b-331c-41ea-b001-0315a45739c4.jpeg