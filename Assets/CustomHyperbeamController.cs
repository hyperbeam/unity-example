using System;
using System.Collections;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Hyperbeam;
using JetBrains.Annotations;
using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.Networking;

public class CustomHyperbeamController : MonoBehaviour
{
    public GameObject player;
    public HyperbeamController controller;
    public float resumeDistance;
    public float disconnectDistance;

    private bool _isDisconnected;
    private string _embedUrl = "";

    [DllImport("__Internal")]
    private static extern void getDemoLink(string objName);
    
    private void Start()
    {
        StartHyperbeam();
    }

    private void StartHyperbeam()
    {
        if (_embedUrl == "")
        {
            getDemoLink(gameObject.name);
            return;
        }
        
        Debug.Log($"embedUrl: {_embedUrl}");
        controller.StartHyperbeamStream(_embedUrl);
        _isDisconnected = false;
    }

    private void Update()
    {
        var distance = Vector3.Distance(player.gameObject.transform.position, transform.position);
        if (_isDisconnected)
        {
            if (distance > resumeDistance) return;
            StartHyperbeam();
        }
        else
        {
            if (distance < disconnectDistance) return;
            controller.Instance.Dispose();
            _isDisconnected = true;
        }
    }

    [UsedImplicitly]
    public void OnDemoLink(string demoLink)
    {
        _embedUrl = demoLink;
        StartHyperbeam();
    }
}