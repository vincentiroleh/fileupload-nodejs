const express = require('express');
const app = express();
const path = require('path');

const mongoose = require('mongoose');
const multer = require('multer');
const methodOverride = require('method-override');
const fs = require('fs');

mongoose.connect('mongodb://localhost:27017/upload-images', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

let imageSchema = new mongoose.Schema({
    imgUrl: String,
});

let Picture = mongoose.model('Picture', imageSchema);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(methodOverride('_method'));

app.get('/upload', (req, res) => res.render('upload'));
app.get('/', async (req, res) => {
    const images = await Picture.find({});
    res.render('index', { images });
});

// set image storage
let storage = multer.diskStorage({
    destination: './public/upload/images/',
    filename: (req, file, cb) => cb(null, file.originalname)
});

let upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => checkFileType(file, cb)
});

function checkFileType(file, cb) {
    const fileType = /jpeg|jpg|png|gif/;
    const extname = fileType.test(path.extname(file.originalname).toLocaleLowerCase());

    if (extname) return cb(null, true);
    cb('Error: please images only.')
}

app.post('/uploadsingle', upload.single('singleImage'), async (req, res, next) => {
    const file = req.file;
    if (!file) return console('Please select an image')
    let url = file.path.replace('public', '');

    try {
        let img = await Picture.findOne({ imgUrl: url });
        if (img) { console.log('Duplicate Image, Try again'); return res.redirect('/upload') }
        img = await Picture.create({ imgUrl: url });
        console.log('Image saved to DB');
        res.redirect('/');
    } catch (error) { throw Error(error) }

});

app.post('/uploadmultiple', upload.array('multipleImages'), (req, res, next) => {
    const files = req.files;
    if (!files) return console('Please select images')

    try {
        files.forEach(async file => {
            let url = file.path.replace('public', '');
            let img = await Picture.findOne({ imgUrl: url });
            if (img) return console.log('Duplicate Images, Try again');
            await Picture.create({ imgUrl: url });
            console.log('Image saved to DB');
        });
        res.redirect('/');
    } catch (error) { throw Error(error) }
});

app.delete('/delete/:id', async (req, res) => {
    try {
        let searchQuery = { _id: req.params.id };
        let img = await Picture.findOne(searchQuery);
        
        fs.unlink(`${__dirname}/public/${img.imgUrl}`, async (err) => {
            if (err) return console.log(err);
            await Picture.deleteOne(searchQuery);
            res.redirect('/');
        })
    } catch (error) {
        throw Error(error);

    }
})

app.listen(3000, () => console.log('✈️  server is started'));