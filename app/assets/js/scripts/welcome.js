/**
 * Script for welcome.ejs
 */
document.getElementById('welcomeButton').addEventListener('click', e => {
    loginOptionsViewOnLoginSuccess = VIEWS.landing
    loginOptionsViewOnLoginCancel = VIEWS.welcome
    switchView(VIEWS.welcome, VIEWS.login, () => {
        loginViewOnSuccess = loginOptionsViewOnLoginSuccess
        loginCancelEnabled(false)
    })
})
