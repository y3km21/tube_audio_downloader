port module Main exposing (..)

import Browser
import Browser.Dom as Dom
import ContextMenu as CM
import Html exposing (Html)
import Html.Attributes as Attributes
import Html.Attributes.Classname exposing (classMixinWith)
import Html.Events as Events
import Json.Decode as JD
import Json.Encode as JE
import Mixin exposing (Mixin)
import Mixin.Html as Mixin
import Task



-- App


main : Program () Model Msg
main =
    Browser.element
        { init = \_ -> init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }



-- Ports


port getHomeDir : () -> Cmd msg


port chooseDir : String -> Cmd msg


port convert : JE.Value -> Cmd msg


port appquit : () -> Cmd msg


port paste : () -> Cmd msg


port getDirReceiver : (JE.Value -> msg) -> Sub msg


port convertStatusReceiver : (JE.Value -> msg) -> Sub msg



-- Model


type alias Model =
    { outputDir : String
    , youtubeUrl : String
    , statusMessage : StatusMessage
    , logTextList : List String
    , contextMenu : CM.ContextMenu Context
    , config : CM.Config
    }


type Status
    = Init
    | Ready
    | Running
    | Error
    | Finish
    | Invalid


type Context
    = Input


type alias StatusMessage =
    { status : Status
    , message : String
    }


init : ( Model, Cmd Msg )
init =
    let
        ( contextMenu, msg ) =
            CM.init
    in
    ( Model "" "" (StatusMessage Init "") [] contextMenu CM.defaultConfig
    , Cmd.batch [ getHomeDir (), Cmd.map ContextMenuMsg msg ]
    )


type Msg
    = NoOp
    | GotDirMessage JE.Value
    | InputOutputDir String
    | InputUrl String
    | ChooseDir
    | ConvertStart
    | AppQuit
    | GotConvertMessage JE.Value
    | FocusLog (Result Dom.Error ())
    | ContextMenuMsg (CM.Msg Context) -- ContextMenu
    | Item String -- ContextMenu


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    let
        addFocusLog ( mdl, cmdmsg ) =
            ( mdl
            , Cmd.batch
                [ cmdmsg
                , logfocusCmdMsg
                ]
            )
    in
    case msg of
        NoOp ->
            ( model, Cmd.none )

        -- Port Receive Init, Port Receive ChooseDir
        GotDirMessage jevalue ->
            case JD.decodeValue outputDirDecoder jevalue of
                Ok str ->
                    ( { model
                        | outputDir = str
                        , statusMessage = StatusMessage Ready ""
                        , logTextList =
                            if model.statusMessage.status /= Ready then
                                logupdate (StatusMessage Ready "Ready...") model.logTextList

                            else
                                model.logTextList
                      }
                    , Cmd.none
                    )
                        |> addFocusLog

                Err _ ->
                    ( { model
                        | statusMessage = StatusMessage Error "Decode Error"
                        , logTextList = logupdate (StatusMessage Error "Decode Error") model.logTextList
                      }
                    , Cmd.none
                    )
                        |> addFocusLog

        -- Input Change
        InputOutputDir str ->
            ( { model | outputDir = str }, Cmd.none )

        InputUrl str ->
            ( { model | youtubeUrl = str }, Cmd.none )

        -- Port Out ChooseDir
        ChooseDir ->
            ( model
            , chooseDir model.outputDir
            )

        ConvertStart ->
            ( model
            , convert <|
                JE.object
                    [ ( "outputDir", JE.string model.outputDir )
                    , ( "youtubeUrl", JE.string model.youtubeUrl )
                    ]
            )

        AppQuit ->
            ( model, appquit () )

        -- Port Receive Convert Status
        GotConvertMessage jevalue ->
            case JD.decodeValue convertStatusDecoder jevalue of
                Ok statusmes ->
                    ( { model
                        | statusMessage = statusmes
                        , logTextList = logupdate statusmes model.logTextList
                      }
                    , Cmd.none
                    )
                        |> addFocusLog

                Err _ ->
                    ( { model
                        | statusMessage = StatusMessage Error "Decode Error"
                        , logTextList = logupdate (StatusMessage Error "Decode Error") model.logTextList
                      }
                    , Cmd.none
                    )
                        |> addFocusLog

        -- Focus Bottom When Log Update
        FocusLog result ->
            case result of
                Ok () ->
                    ( model, Cmd.none )

                Err _ ->
                    ( model, Cmd.none )

        -- ContextMenu
        ContextMenuMsg msg_ ->
            let
                ( contextMenu, cmd ) =
                    CM.update msg_ model.contextMenu
            in
            ( { model | contextMenu = contextMenu }, Cmd.map ContextMenuMsg cmd )

        Item str ->
            case str of
                "Paste" ->
                    ( model, paste () )

                _ ->
                    ( model, Cmd.none )


logfocusCmdMsg : Cmd Msg
logfocusCmdMsg =
    Task.andThen (\vp -> Dom.setViewportOf "log" 0 (vp.scene.height - vp.viewport.height)) (Dom.getViewportOf "log")
        |> Task.attempt FocusLog


view : Model -> Html Msg
view model =
    Mixin.div [ class "window_wrapper" ]
        [ Mixin.div [ class "title_bar" ]
            [ Mixin.lift Html.button
                [ Mixin.unless (model.statusMessage.status == Running) <| Mixin.fromAttribute <| Events.onClick AppQuit
                , Mixin.when (model.statusMessage.status == Running) <| Mixin.attribute "type" "Inactive"
                ]
                []
            , Mixin.span [] [ Html.text "TubeAudioConverter" ]
            ]
        , Mixin.div
            [ class "content_wrapper"
            ]
            [ Mixin.div [ class "row_wrapper" ]
                [ Mixin.lift Html.label [] [ Html.text "出力先フォルダ :" ]
                , Mixin.lift Html.input
                    [ Mixin.fromAttribute <| Attributes.value model.outputDir
                    , Mixin.fromAttribute <| Events.onInput InputOutputDir
                    , Mixin.fromAttribute <| CM.open ContextMenuMsg Input
                    ]
                    []
                , Mixin.lift Html.button
                    [ Mixin.unless (model.statusMessage.status == Running) <| Mixin.fromAttribute <| Events.onClick ChooseDir
                    , Mixin.when (model.statusMessage.status == Running) <| Mixin.attribute "type" "Inactive"
                    ]
                    [ Html.text "フォルダ選択" ]
                ]
            , Mixin.div [ class "row_wrapper" ]
                [ Mixin.lift Html.label [] [ Html.text "Youtube Url :" ]
                , Mixin.lift Html.input
                    [ Mixin.fromAttribute <| Attributes.value model.youtubeUrl
                    , Mixin.fromAttribute <| Events.onInput InputUrl
                    , Mixin.fromAttribute <| CM.open ContextMenuMsg Input
                    ]
                    []
                ]
            , Mixin.div [ class "row_center_wrapper" ]
                [ Mixin.lift Html.button
                    [ Mixin.unless (model.statusMessage.status == Running) <| Mixin.fromAttribute <| Events.onClick ConvertStart
                    , Mixin.when (model.statusMessage.status == Running) <| Mixin.attribute "type" "Inactive"
                    ]
                    [ Html.text "変換" ]
                ]
            , Mixin.div [ class "row_center_wrapper" ]
                [ statusview model.statusMessage ]
            , Mixin.div [ class "log_wrapper", Mixin.id "log" ] <|
                logview model.logTextList
            , CM.view model.config ContextMenuMsg toItemGroups model.contextMenu
            ]
        ]


statusview : StatusMessage -> Html Msg
statusview ({ status, message } as statusMessage) =
    case status of
        Init ->
            Mixin.span
                [ class "status"
                , Mixin.fromAttribute <| Attributes.style "background-color" "brown"
                ]
                [ Html.text "Init" ]

        Ready ->
            Mixin.span [ class "status" ] [ Html.text "Ready..." ]

        Running ->
            Mixin.span [ class "status" ] [ Html.text <| "Running..." ]

        Error ->
            Mixin.span
                [ class "status"
                , Mixin.fromAttribute <| Attributes.style "background-color" "red"
                ]
                [ Html.text <| "Error : " ++ message ]

        Finish ->
            Mixin.span
                [ class "status"
                , Mixin.fromAttribute <| Attributes.style "background-color" "green"
                ]
                [ Html.text "Complete!" ]

        Invalid ->
            Mixin.span
                [ class "status"
                , Mixin.fromAttribute <| Attributes.style "background-color" "red"
                ]
                [ Html.text "Invalid" ]


logview : List String -> List (Html Msg)
logview liststring =
    liststring
        |> List.map (\str -> Mixin.span [] [ Html.text str ])


newLogFocus : String -> Cmd Msg
newLogFocus id =
    Task.attempt (\_ -> NoOp) (Dom.focus id)


logupdate : StatusMessage -> List String -> List String
logupdate ({ message } as statusMessage) logs =
    List.append logs [ message ]


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ getDirReceiver GotDirMessage
        , convertStatusReceiver GotConvertMessage
        , Sub.map ContextMenuMsg (CM.subscriptions model.contextMenu)
        ]



--ContextMenu


toItemGroups : Context -> List (List ( CM.Item, Msg ))
toItemGroups context =
    case context of
        Input ->
            [ [ ( CM.item "Paste", Item "Paste" ) ] ]



-- Decoder


outputDirDecoder : JD.Decoder String
outputDirDecoder =
    JD.at [ "outputDir" ] JD.string


convertStatusDecoder : JD.Decoder StatusMessage
convertStatusDecoder =
    JD.map2 StatusMessage
        (JD.field "status"
            (JD.string
                |> JD.andThen
                    (\string ->
                        case string of
                            "Init" ->
                                JD.succeed Init

                            "Ready" ->
                                JD.succeed Ready

                            "Running" ->
                                JD.succeed Running

                            "Error" ->
                                JD.succeed Error

                            "Finish" ->
                                JD.succeed Finish

                            "Invalid" ->
                                JD.succeed Invalid

                            _ ->
                                JD.fail "Invalid Status"
                    )
            )
        )
        (JD.field "logmessage" JD.string)



-- Helper functions


{-| A specialized version of `class` for this module.
It converts given class names into ones generated by CSS modules.
-}
class : String -> Mixin msg
class =
    --classMixinWith <| \name -> "app__" ++ name
    classMixinWith <| \name -> name

