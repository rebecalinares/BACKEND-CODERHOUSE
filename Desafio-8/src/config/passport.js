import passport from "passport";
import GithubStrategy from 'passport-github2'
import local from "passport-local"
import { MongoUserManager } from "../dao/mongo/MongoUserManager.js";
import { MongoCartManager } from '../dao/mongo/MongoCartManager.js'
import { createHash, isValidPassword } from "../ultis/bcrypt.js";
import UserModel from '../dao/mongo/models/user.js'

const LocalStrategy = local.Strategy
const mongoUserManager = new MongoUserManager
const mongoCartManager = new MongoCartManager

export const initPassport = ()=>{

    passport.serializeUser((user, done)=>{
        done(null, user.id)
    })

    passport.deserializeUser(async (id, done)=>{
        try {
            let user = await UserModel.findById(id)
            done(null, user)
        } catch (error) {
            console.log(error)
            done(error)
        }
    })

    passport.use('github', new GithubStrategy({
        clientID: 'Iv1.b6ac1a5f856717dc',
        clientSecret: 'de3844f079b2117ee877294638dd6e0d6d5ef1b2',
        callbackURL: 'http://localhost:8080/auth/githubcallback'
    }, async (accessToken, refreshToken, profile, done)=>{
        console.log('accessToken: ', accessToken)
        console.log('refreshToken: ', refreshToken)
        console.log('Profile: ',profile)
        try {
            let user = await UserModel.findOne({email: profile._json.email})
            console.log(profile._json.email);
            if (!user) {
                let newUser = {
                    first_name: profile.username,
                    last_name: profile.username,
                    age: 18,
                    roll: 'user',
                    email: profile._json.email,
                    password: '1234'
                }
                let result= await UserModel.create(newUser)
                return done(null, result)
            }
            
            return done(null, user)
        } catch (error) {
            return done(error)
        }
    }))

    passport.use('login', new LocalStrategy(
        {
            usernameField: 'username'
        },
        async (username, password, done) => {
            console.log('login passport')
            try {
                let user = await mongoUserManager.getUser(username)
                console.log(user)
                if (!user) {
                    console.log('usuario no existe')
                    return done(null, false)
                }

                if(!isValidPassword(user, password)){
                    console.log('datos invalidos')
                    return done(null, false)
                }
                return done(null, user)
            } catch (error) {
                console.log(error)
                return done(error)
            }
        }
    ))

    passport.use('register', new LocalStrategy(
        {
            passReqToCallback: true,
            usernameField: 'email',
        },
        async (req, username, password, done)=>{
            const { first_name, last_name, age, roll = 'user', email } = req.body
            console.log('username: ',username);
            console.log('password: ',password);
            try {
                
                let exist = await mongoUserManager.getUser(username)
                
                if(exist) {
                    console.log('el usuario ya existe')
                    return done(null, false)
                }else{
                    let cart = await mongoCartManager.createCart()
                    
                    let user = { first_name, last_name, age, roll, email, cart: cart._id, password: createHash(password) }

                    let result = await mongoUserManager.addUser(user)
                    
                    console.log('el usuario se creo correctamente: ', result)
                    return done(null, result)
                }
            } catch (error) {
                console.log(error)
                return done('Error al obrener el usuario'+error)
            }
        }
    ))
}