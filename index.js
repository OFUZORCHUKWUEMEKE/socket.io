const express = require('express')

const http = require('http')

const socketio = require('socket.io')

const cors = require('cors')

const PORT = process.env.PORT  || 5000

const app = express()

const {getUser,removeUser , getUsersInRoom,addUser} = require('./users')



const router = require('./router')

const server = http.createServer(app)

app.use(router) 
app.use(cors())

const io = socketio(server)



io.on('connect', (socket) => { 
    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });
    
        if(error) return callback(error);   
    
        socket.join(user.room);
    
        socket.emit('message', { user: 'admin', text: `${user.name}, WELCOME TO ROOM ${user.room}.`});
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });
    
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    
        callback();
      });
   
    socket.on('sendMessage',(message,callback) =>{ 
        const user = getUser(socket.id)
        console.log(message);
        if(!user){
          console.log('errors');
          // socket.off()
        }
        else{
          io.to(user.room).emit('message',{user:user.name,text:message})
          console.log(user); 
          callback()
        }
       
       
        

    })
    // socket.on('typing',({name,room})=>{
    //   const user = getUser(socket.id)
    //   socket.to(user.room).broadcast.emit('typing',{user:user.name,text:`${user.name} is typing ..`})
    // }) 

    socket.on('disconnect',()=>{
    const user = removeUser(socket.id);  

    if(user) {
      io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
    }
  })
}) 




// server.listen(process.env.PORT || 5000,()=>{
//     console.log('app listening at port 5000')
// })
server.listen(PORT, () => console.log(`Server has started.`));