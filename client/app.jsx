import React from 'react';
import {render} from 'react-dom';
//import RaisedButton from 'material-ui/RaisedButton';
//import Dialog from 'material-ui/Dialog';
//import {deepOrange500} from 'material-ui/styles/colors';
//import FlatButton from 'material-ui/FlatButton';
//import getMuiTheme from 'material-ui/styles/getMuiTheme';
//import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
//import TextField from 'material-ui/TextField';

const socket = io.connect();

class Login extends React.Component {
    _login() {
        const username = document.querySelector("#login-name").value.trim();
        if (username) {
            //console.log(username)
            socket.emit('user:join', {username: username})
        }
    }

    render() {
        return (
            <div id="login-section">
                <input
                    type="text"
                    id="login-name"
                    label="Enter your username"
                    />
                <button onClick={this._login}>Join</button>
            </div>
        )
    }

}

class Chat extends React.Component {
    constructor (props) {
        super(props)

        this.state = {
            userList: this.props.userList,
            messages: this.props.messages || [],
            typing  : null,
            notification:'',
            groupList:[],
            groupMessages:[]
        };
        socket.on('message', msg=>{
            this.setState({
                messages: msg.reverse(),
                typing: null
            });
        });
        socket.on('typing', user=>{
            this.setState({
                typing: user
            });
        });
        socket.on('new user', userList=>{
            userList.users =  userList.users.filter(user=>{
                return user._id != this.props.user._id
            });
            this.setState({
                userList: userList.users
            });
        });
        socket.on('group message',  data=>{
            console.log(data)
        });
        socket.on('group-message', data=>{
            this.setState({
                groupMessages: data.reverse()
            })
        });
        socket.on('new group',  data=>{
            console.log(data)
            console.log(this.props.user._id)
            let a = Object.keys(data.groupList).filter(k=>{
                return data.groupList[k].users.indexOf(this.props.user._id) < 0
            });
            console.log(a)
            this.setState({
                notification:data.notification,
                groupList: data.groupList//{_id:ddd,name:lll}
            });
            setTimeout(()=>{
                this.setState({
                    notification:''
                });
            }, 5000)
        })
    }
    _typing () {
        socket.emit('typing', {user:this.props.user})
    }
    _send() {
        const message = $('#message').val().trim();
        if(message) {
            socket.emit('message', {message:message,user:this.props.user})
            $('#message').val('');
        }
    }
    _createGroup() {
        let users = [];
        $('#users input:checked').each((id, user) => {
            users.push($(user).attr('id'));
        });
        console.log(users);
        let groupName = $('#groupName').val();
        socket.emit('createGroup', {groupName:groupName, users:users})
        $('#groupName').val('');
        $('#users input:checked').prop('checked', false);
    }
    _sendGroup() {
        const message = $('#group-message').val().trim();
        const groupId = $('#group-id').val();
        if(message) {
            socket.emit('group-message', {message:message,user:this.props.user, groupId:groupId});
            $('#group-message').val('');
        }
    }
    render() {
        return (
            <div className="chat-section">
                <div style={{float:'left'}}>
                    <div>{this.state.typing ? this.state.typing.user.username+' is typing...' :'' }</div>
                    <div>
                        <textarea
                            type="text"
                            id="message"
                            onChange={this._typing.bind(this)}
                            label="Type message">
                        </textarea>
                        <button onClick={this._send.bind(this)}>Send</button>
                    </div>
                    <div>
                        <div>{this.state.notification}</div>
                        <ul>
                            {
                                this.state.messages.map(msg=>{
                                    let username = msg.user._id == this.props.user._id ? msg.user.username+'(me)' : msg.user.username;
                                    return(
                                        <li key={msg._id}>
                                            <span>{username}</span><br/>
                                            <span>{msg.message}</span>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </div>
                </div>
                <div>
                    <select id="group-id">
                    {
                        Object.keys(this.state.groupList).map(key=>{
                            let group = this.state.groupList[key];
                            return(
                                <option key={group._id} value={group._id}>{group.groupName}</option>
                            )
                        })
                    }
                    </select>
                    <textarea
                        type="text"
                        id="group-message"
                        label="Type message">
                    </textarea>
                    <button onClick={this._sendGroup.bind(this)}>Send</button>
                    <ul>
                        {
                            this.state.groupMessages.map(msg=>{
                                let username = msg.user._id == this.props.user._id ? msg.user.username+'(me)' : msg.user.username;
                                return(
                                    <li key={msg._id}>
                                        <span>{username}</span><br/>
                                        <span>{msg.message}</span>
                                    </li>
                                )
                            })
                        }
                    </ul>
                </div>
                <div style={{float:'right'}}>
                    <ul id="users">
                        {
                            this.state.userList.map(user=>{
                                return (
                                    <li key={user._id}>
                                        <span>{user.username}</span>
                                        <span><input type="checkbox" id={user._id} /></span>
                                    </li>
                                )
                            })
                        }
                    </ul>
                    <div>
                        <input id="groupName" type="text" placeholder="Group name"/>
                        <button onClick={this._createGroup.bind(this)}>Create Group</button>
                    </div>
                </div>
            </div>
        )
    }

}

socket.on('redirectToChat', (data)=>{
    //console.log('redirectToChat', data);
    data.users = data.users.filter(user=>{
        return user._id != data.user._id
    });
    console.log('redirectToChat: ', data.users)
    render(<Chat user={data.user} userList={data.users}/>, document.getElementById('app'));
});
render(<Login/>, document.getElementById('app'));