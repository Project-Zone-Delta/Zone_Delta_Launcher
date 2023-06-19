/**
 * Script for welcome.ejs
 */
document.getElementById('welcomeButton').addEventListener('click', e => {
    loginOptionsCancelEnabled(false) // False by default, be explicit.

    loginOptionsViewOnLoginSuccess = VIEWS.landing
    loginOptionsViewOnLoginCancel = VIEWS.welcome
    switchView(VIEWS.welcome, VIEWS.login, () => {
        loginViewOnSuccess = loginOptionsViewOnLoginSuccess
        
        loginCancelEnabled(false)
    })
})